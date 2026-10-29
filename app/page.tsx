"use client";

import { useState } from "react";

type AskResponse = {
  sql?: string;
  rows?: Record<string, unknown>[];
  error?: string;
  refused?: boolean;
  motivo?: string;
  premissa?: string;
};

const EXAMPLES = [
  "Quais os 5 produtos mais vendidos?",
  "Qual o faturamento total?",
  "Quantos clientes temos por estado?",
  "Qual a nota média de avaliação por categoria?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text) return;
    setQuestion(text);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  const rows = result?.rows ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <main className="container">
      <header className="hero">
        <span className="eyebrow">⌁ text-to-SQL · e-commerce</span>
        <h1>Analytics Agent</h1>
        <p>Pergunte em português. Ele gera o SQL, roda no Postgres e responde.</p>
      </header>

      <div className="ask">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) ask();
          }}
          placeholder="Ex: quais os 5 produtos mais vendidos?"
          aria-label="Pergunta"
        />
        <button
          className="btn"
          onClick={() => ask()}
          disabled={loading || !question.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Consultando
            </>
          ) : (
            "Perguntar"
          )}
        </button>
      </div>

      {!result && !loading && (
        <div className="chips">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip" onClick={() => ask(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {result?.sql && (
        <section className="section">
          <div className="section-label">🧩 SQL gerado</div>
          <pre className="sql">{result.sql}</pre>
        </section>
      )}

      {result?.premissa && (
        <section className="section">
          <div className="callout callout-info">
            <span className="ic">💡</span>
            <span>
              <strong>Interpretei como:</strong> {result.premissa}
            </span>
          </div>
        </section>
      )}

      {result?.refused && (
        <section className="section">
          <div className="callout callout-warn">
            <span className="ic">🚫</span>
            <span>
              <strong>Não dá para responder.</strong>{" "}
              {result.motivo ?? "O dado solicitado não existe no schema."}
            </span>
          </div>
        </section>
      )}

      {result?.error && (
        <section className="section">
          <div className="callout callout-error">
            <span className="ic">⚠️</span>
            <span>
              <strong>Erro.</strong> {result.error}
            </span>
          </div>
        </section>
      )}

      {result && !result.error && !result.refused && (
        <section className="section">
          <div className="result-head">
            <h3>Resultados</h3>
            <span className="count">{rows.length} linhas</span>
          </div>
          {rows.length === 0 ? (
            <div className="table-wrap">
              <p className="empty">Nenhuma linha retornada.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {columns.map((c) => {
                          const v = row[c];
                          const isNum = typeof v === "number";
                          return (
                            <td key={c} className={isNum ? "num" : undefined}>
                              {formatCell(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="footer">
        Next.js · Prisma · PostgreSQL · Groq ·{" "}
        <a
          href="https://github.com/EnzoFreitassn/analytics-agents"
          target="_blank"
          rel="noreferrer"
        >
          código no GitHub
        </a>
      </footer>
    </main>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("pt-BR")
      : value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
