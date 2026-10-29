// Guard mínimo de segurança para o SQL gerado pelo LLM.
// Objetivo desta etapa: barrar o óbvio, não ser à prova de balas.

const FORBIDDEN = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "TRUNCATE",
  "CREATE",
  "GRANT",
  "REVOKE",
  "MERGE",
  "COPY",
];

/**
 * Valida o SQL e normaliza:
 *  - aceita SELECT e também CTEs de leitura (WITH ... SELECT);
 *  - rejeita se contiver comandos de escrita/DDL;
 *  - rejeita múltiplos comandos;
 *  - adiciona LIMIT 500 quando o SELECT final não tem LIMIT
 *    (sem confundir com um LIMIT que esteja dentro de uma CTE/subquery).
 * Lança Error quando reprovado.
 */
export function guardSql(rawSql: string): string {
  // Remove espaços e ponto-e-vírgula final.
  let sql = rawSql.trim().replace(/;\s*$/, "").trim();

  const upper = sql.toUpperCase();

  // Aceita consulta que começa com SELECT ou com WITH (CTE de leitura).
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    throw new Error(
      "Consulta rejeitada: só são permitidas consultas de leitura (SELECT ou WITH ... SELECT)."
    );
  }

  for (const word of FORBIDDEN) {
    // \b garante que casamos a palavra inteira (evita "created_at" virar match).
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(sql)) {
      throw new Error(`Consulta rejeitada: comando não permitido (${word}).`);
    }
  }

  // Impede múltiplos statements (ex: "SELECT 1; DROP ...").
  if (sql.includes(";")) {
    throw new Error("Consulta rejeitada: múltiplos comandos não são permitidos.");
  }

  // Só pula o LIMIT se a consulta JÁ TERMINA com um LIMIT (o do SELECT final).
  // Um LIMIT dentro de uma CTE/subquery não fica no fim da string, então
  // ainda aplicamos o LIMIT 500 externo — que é o comportamento desejado.
  const endsWithLimit = /\blimit\s+\d+(\s+offset\s+\d+)?\s*$/i.test(sql);
  if (!endsWithLimit) {
    sql = `${sql} LIMIT 500`;
  }

  return sql;
}
