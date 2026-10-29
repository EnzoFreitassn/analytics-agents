// Runner de diagnóstico da Etapa 3.
// Para cada pergunta: gera SQL -> guard -> executa. NÃO corrige nada.
// Grava um .md com pergunta, SQL, se rodou, erro e as primeiras linhas.
//
// Uso:
//   LLM_MODEL=openai/gpt-oss-120b DATABASE_URL=... \
//     npx ts-node --compiler-options '{"module":"CommonJS"}' evals/run.ts evals/results-120b.md
//
// As variáveis LLM_BASE_URL / LLM_API_KEY / LLM_MODEL / DATABASE_URL vêm do ambiente.

import { writeFileSync } from "fs";
import { join } from "path";
import { generateSql } from "../lib/llm";
import { guardSql } from "../lib/guard";
import { runReadOnlyQuery } from "../lib/runQuery";
import { toJsonSafe } from "../lib/serialize";
import { prisma } from "../lib/prisma";

type Question = {
  id: string;
  pergunta: string;
  categoria: string;
  observacao: string;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const questions: Question[] = require("./questions.json");

const outPath = process.argv[2] ?? "evals/results.md";
const model = process.env.LLM_MODEL ?? "(indefinido)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function firstRows(rows: unknown[], n = 5): string {
  const slice = rows.slice(0, n);
  return JSON.stringify(slice, null, 2);
}

async function main() {
  const lines: string[] = [];
  lines.push(`# Resultados de diagnóstico — modelo \`${model}\``);
  lines.push("");
  lines.push(`Gerado em ${new Date().toISOString()}. Pipeline cru (sem RAG, sem retry, sem autocorreção).`);
  lines.push("");

  let okCount = 0;
  let refusedCount = 0;
  let errCount = 0;
  let promptTokensSum = 0;
  let promptTokensN = 0;

  for (const q of questions) {
    console.log(`[${model}] ${q.id} ${q.pergunta}`);

    let sql = "";
    let ran = false;
    let refused = false;
    let motivo = "";
    let premissa = "";
    let errorMsg = "";
    let rowsOut = "";
    let promptTokens = 0;
    let retrievedTables = "";

    try {
      const gen = await generateSql(q.pergunta);
      if (gen.usage) {
        promptTokens = gen.usage.promptTokens;
        promptTokensSum += promptTokens;
        promptTokensN++;
      }
      if (gen.retrieval) {
        retrievedTables = gen.retrieval.tables.join(", ");
      }
      if (gen.sql === null) {
        // Canal de recusa: o modelo diz que o dado não existe no schema.
        refused = true;
        motivo = gen.motivo ?? "(sem motivo)";
        refusedCount++;
      } else {
        premissa = gen.premissa ?? "";
        try {
          sql = guardSql(gen.sql);
        } catch (e) {
          // Guard rejeitou: guarda o SQL cru para inspeção.
          sql = gen.sql;
          throw new Error(`GUARD: ${(e as Error).message}`);
        }
        const rows = await runReadOnlyQuery(sql);
        ran = true;
        rowsOut = firstRows(toJsonSafe(rows) as unknown[]);
        okCount++;
      }
    } catch (e) {
      errorMsg = (e as Error).message;
      errCount++;
    }

    const estado = refused ? "🚫 recusou" : ran ? "✅ ok" : "❌ erro";

    lines.push(`## ${q.id} — ${q.categoria}`);
    lines.push("");
    lines.push(`**Pergunta:** ${q.pergunta}`);
    lines.push("");
    lines.push(`**Esperado:** ${q.observacao}`);
    lines.push("");
    lines.push(`**Resultado do pipeline:** ${estado}`);
    lines.push("");
    lines.push(`**prompt_tokens:** ${promptTokens || "(n/d)"}`);
    lines.push("");
    if (retrievedTables) {
      lines.push(`**Tabelas recuperadas (RAG):** ${retrievedTables}`);
      lines.push("");
    }
    if (refused) {
      lines.push(`**Motivo da recusa:** ${motivo}`);
      lines.push("");
    } else {
      if (premissa) {
        lines.push(`**Premissa (ambiguidade):** ${premissa}`);
        lines.push("");
      }
      lines.push(`**SQL gerado:**`);
      lines.push("```sql");
      lines.push(sql || "(não gerou SQL)");
      lines.push("```");
      lines.push("");
    }
    if (errorMsg) {
      lines.push(`**Erro:** \`${errorMsg.split("\n")[0]}\``);
      lines.push("");
    }
    if (ran) {
      lines.push(`**Resultado (primeiras linhas):**`);
      lines.push("```json");
      lines.push(rowsOut);
      lines.push("```");
      lines.push("");
    }
    lines.push("---");
    lines.push("");

    // Intervalo entre perguntas (configurável). O free tier da Groq tem
    // limite de tokens/minuto baixo; modelos menores precisam de mais folga.
    await sleep(Number(process.env.EVAL_DELAY_MS ?? 600));
  }

  const avgPromptTokens = promptTokensN > 0 ? Math.round(promptTokensSum / promptTokensN) : 0;

  lines.splice(
    4,
    0,
    `**Resumo:** ${okCount} rodaram, ${refusedCount} recusaram (dado inexistente), ` +
      `${errCount} falharam (de ${questions.length}). ` +
      `prompt_tokens médio por pergunta: ${avgPromptTokens} (baseline "tudo no prompt"). ` +
      `Obs: "rodou" só indica que o SQL executou — não que a resposta está semanticamente correta.`,
    ""
  );

  writeFileSync(join(process.cwd(), outPath), lines.join("\n"), "utf8");
  console.log(
    `\nEscrito: ${outPath} (${okCount} ok / ${refusedCount} recusa / ${errCount} erro | prompt_tokens médio ${avgPromptTokens})`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
