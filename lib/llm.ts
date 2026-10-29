import OpenAI from "openai";
import { SCHEMA_DESCRIPTION } from "./schema";
// IMPORTANTE: importamos APENAS o tipo de ./rag aqui (import type é apagado na
// compilação). O módulo ./rag — e, por tabela, @xenova/transformers — só é
// carregado via import() dinâmico quando USE_RAG está ligado (ver abaixo).
// Assim o runtime do baseline (USE_RAG=false) nunca baixa o modelo de embedding.
import type { Retrieval } from "./rag";

// SDK da OpenAI apontado para a Groq (compatível com a API da OpenAI).
const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

// Regras/contrato — iguais nos dois modos (baseline e RAG).
const CONTRACT_RULES = `
Regras:
- Gere apenas SQL de leitura: SELECT (pode usar WITH ... SELECT). Nunca
  INSERT/UPDATE/DELETE/DDL.
- Use exatamente os nomes de tabela e coluna em snake_case.

- RECUSA (só para dado inexistente): se a pergunta NÃO puder ser respondida
  porque não existe coluna ou tabela para aquilo no schema (ex: canal de
  marketing, custo de aquisição, satisfação do atendimento/SAC), retorne
  "sql": null e preencha "motivo" com uma frase curta em pt-br dizendo que o
  dado não existe. NÃO invente colunas e NÃO improvise uma métrica substituta.

- AMBIGUIDADE (NÃO é recusa): se o dado EXISTE mas a pergunta admite mais de
  uma métrica/critério razoável (ex: "melhor produto" pode ser por receita,
  por unidades vendidas ou por lucro; "melhores clientes" por valor gasto ou
  por nº de pedidos), NÃO recuse. Escolha a interpretação mais comum, gere o
  SQL normalmente e preencha "premissa" com a interpretação adotada em pt-br,
  citando a alternativa.

- Pergunta clara e sem ambiguidade: retorne só "sql", sem "premissa".

- Resumo: recusa é SÓ para dado inexistente; ambiguidade se resolve
  escolhendo uma leitura e avisando em "premissa".

- Responda SOMENTE com JSON em um destes formatos:
  { "sql": "<a consulta>" }                          pergunta clara
  { "sql": "<a consulta>", "premissa": "<leitura>" } pergunta ambígua
  { "sql": null, "motivo": "<por quê>" }             dado inexistente
`.trim();

const INTRO =
  "Você é um gerador de SQL para PostgreSQL. A partir de uma pergunta em " +
  "português, gere UMA consulta SQL de leitura que a responda.";

// Baseline (4c): schema inteiro no prompt.
const FULL_SYSTEM_PROMPT = `${INTRO}\n\n${SCHEMA_DESCRIPTION}\n\n${CONTRACT_RULES}`;

// Padrão do app: baseline (schema inteiro). O RAG só liga com USE_RAG=true (ou 1).
const USE_RAG = process.env.USE_RAG === "true" || process.env.USE_RAG === "1";

/**
 * Monta o system prompt. Em modo RAG, usa só os chunks recuperados; senão,
 * o schema inteiro (baseline da 4c). Retorna também o que foi recuperado.
 */
async function buildSystemPrompt(
  question: string
): Promise<{ prompt: string; retrieval?: Retrieval }> {
  if (!USE_RAG) return { prompt: FULL_SYSTEM_PROMPT };

  // import() dinâmico: ./rag (e @xenova/transformers) só carregam aqui.
  const { retrieve } = await import("./rag");
  const retrieval = await retrieve(question, { tables: 6, rules: 4, examples: 3 });
  const prompt = `${INTRO}\n\nUse APENAS o contexto abaixo (tabelas, regras e exemplos recuperados).\n\n${retrieval.context}\n\n${CONTRACT_RULES}`;
  return { prompt, retrieval };
}

export type SqlGeneration = {
  sql: string | null;
  motivo?: string;
  premissa?: string;
  usage?: { promptTokens: number; completionTokens: number };
  retrieval?: Retrieval; // presente em modo RAG
};

/**
 * Chama o LLM e retorna { sql, motivo?, premissa?, usage?, retrieval? }.
 * - sql=null  -> recusa (dado não existe no schema), com motivo.
 * - premissa  -> interpretação adotada numa pergunta ambígua.
 * Nesta etapa: sem retry, sem autocorreção.
 */
export async function generateSql(question: string): Promise<SqlGeneration> {
  const { prompt, retrieval } = await buildSystemPrompt(question);

  const completion = await client.chat.completions.create({
    model: process.env.LLM_MODEL as string,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: question },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const usage = completion.usage
    ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
      }
    : undefined;

  const parsed = JSON.parse(content) as {
    sql?: string | null;
    motivo?: string;
    premissa?: string;
  };

  // Recusa explícita do modelo.
  if (parsed.sql === null) {
    return {
      sql: null,
      motivo: parsed.motivo ?? "Dado não disponível no schema.",
      usage,
      retrieval,
    };
  }

  if (typeof parsed.sql !== "string" || parsed.sql.trim() === "") {
    throw new Error("O LLM não retornou um campo 'sql' válido.");
  }

  return { sql: parsed.sql, premissa: parsed.premissa, usage, retrieval };
}
