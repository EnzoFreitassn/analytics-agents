import { NextResponse } from "next/server";
import { generateSql } from "@/lib/llm";
import { guardSql } from "@/lib/guard";
import { runReadOnlyQuery } from "@/lib/runQuery";
import { toJsonSafe } from "@/lib/serialize";

export const runtime = "nodejs";

// POST /api/ask  { question }
//   -> { sql, rows }               quando respondeu
//   -> { refused: true, motivo }   quando o dado não existe no schema
//   -> { error, sql? }             quando falhou
// Sem retry, sem autocorreção.
export async function POST(req: Request) {
  let sql: string | undefined;
  try {
    const { question } = (await req.json()) as { question?: string };

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Informe uma pergunta." },
        { status: 400 }
      );
    }

    // 1. LLM gera o SQL (ou recusa)
    const { sql: rawSql, motivo, premissa } = await generateSql(question);

    // Canal de recusa: o dado não existe no schema.
    if (rawSql === null) {
      return NextResponse.json({ refused: true, motivo });
    }

    // 2. Guard de segurança (+ LIMIT 500)
    sql = guardSql(rawSql);

    // 3. Executa em modo somente-leitura
    const rows = await runReadOnlyQuery(sql);

    // 4. Serializa (BigInt / Decimal). premissa só vai quando houver.
    return NextResponse.json({ sql, premissa, rows: toJsonSafe(rows) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Inclui o SQL quando já tínhamos gerado, pra ajudar a depurar a falha.
    return NextResponse.json({ error: message, sql }, { status: 500 });
  }
}
