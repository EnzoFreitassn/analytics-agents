// RAG: índice em memória de chunks (tabelas + regras + exemplos) com
// embeddings locais (all-MiniLM-L6-v2 via @xenova/transformers) e recuperação
// por similaridade de cosseno. O índice é construído uma vez (lazy) e cacheado.

import { TABLE_CHUNKS } from "./tableChunks";
import { GLOSSARY } from "./glossary";
import { EXAMPLES } from "./examples";

type ChunkType = "table" | "rule" | "example";

type Chunk = {
  id: string; // nome da tabela / termo / "ex{n}"
  type: ChunkType;
  embedText: string; // texto usado para embutir e casar com a pergunta
  promptText: string; // texto que entra no prompt quando recuperado
};

type IndexedChunk = Chunk & { vec: number[] };

// --- embedder (carregado uma vez) ---
let embedderPromise: Promise<(t: string) => Promise<number[]>> | null = null;

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      return async (text: string): Promise<number[]> => {
        const out = await pipe(text, { pooling: "mean", normalize: true });
        return Array.from(out.data as Float32Array);
      };
    })();
  }
  return embedderPromise;
}

// --- chunks a indexar ---
function allChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  for (const t of TABLE_CHUNKS) {
    chunks.push({ id: t.table, type: "table", embedText: t.text, promptText: t.text });
  }
  for (const g of GLOSSARY) {
    chunks.push({
      id: g.termo,
      type: "rule",
      embedText: `${g.termo}: ${g.definicao}`,
      promptText: `${g.termo}: ${g.definicao}`,
    });
  }
  EXAMPLES.forEach((e, i) => {
    chunks.push({
      id: `ex${i + 1}`,
      type: "example",
      // casamos a PERGUNTA do exemplo com a pergunta do usuário
      embedText: e.pergunta,
      promptText: `-- ${e.pergunta}\n${e.sql}`,
    });
  });
  return chunks;
}

// --- índice (lazy, cacheado) ---
let indexPromise: Promise<IndexedChunk[]> | null = null;

export function getIndex(): Promise<IndexedChunk[]> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const embed = await getEmbedder();
      const chunks = allChunks();
      const indexed: IndexedChunk[] = [];
      for (const c of chunks) {
        indexed.push({ ...c, vec: await embed(c.embedText) });
      }
      return indexed;
    })();
  }
  return indexPromise;
}

// vetores já vêm normalizados -> cosseno = produto escalar
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function topK(index: IndexedChunk[], type: ChunkType, qv: number[], k: number) {
  return index
    .filter((c) => c.type === type)
    .map((c) => ({ c, score: dot(qv, c.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.c);
}

export type Retrieval = {
  context: string; // bloco para o prompt
  tables: string[];
  rules: string[];
  examples: string[];
};

export async function retrieve(
  question: string,
  opts: { tables?: number; rules?: number; examples?: number } = {}
): Promise<Retrieval> {
  const { tables = 6, rules = 4, examples = 3 } = opts;
  const embed = await getEmbedder();
  const index = await getIndex();
  const qv = await embed(question);

  const tbl = topK(index, "table", qv, tables);
  const rl = topK(index, "rule", qv, rules);
  const ex = topK(index, "example", qv, examples);

  const context = [
    "== TABELAS RELEVANTES ==",
    ...tbl.map((c) => c.promptText),
    "",
    "== REGRAS / MÉTRICAS RELEVANTES ==",
    ...rl.map((c) => c.promptText),
    "",
    "== EXEMPLOS (pergunta -> SQL) ==",
    ...ex.map((c) => c.promptText),
  ].join("\n");

  return {
    context,
    tables: tbl.map((c) => c.id),
    rules: rl.map((c) => c.id),
    examples: ex.map((c) => c.id),
  };
}
