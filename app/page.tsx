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

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);

  async function ask() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2.5rem",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1>Analytics Agent</h1>
      <p style={{ color: "#555" }}>
        Faça uma pergunta em português sobre os dados de e-commerce.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) ask();
          }}
          placeholder="Ex: quais os 5 produtos mais vendidos?"
          style={{
            flex: 1,
            padding: "0.6rem 0.8rem",
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          style={{
            padding: "0.6rem 1.2rem",
            fontSize: 16,
            borderRadius: 6,
            border: "none",
            background: loading ? "#999" : "#0070f3",
            color: "white",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Consultando..." : "Perguntar"}
        </button>
      </div>

      {result?.sql && (
        <section style={{ marginTop: 24 }}>
          <h3>SQL gerado</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: 6,
              overflowX: "auto",
              fontSize: 14,
            }}
          >
            {result.sql}
          </pre>
        </section>
      )}

      {result?.refused && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ color: "#b26a00" }}>Não dá para responder</h3>
          <p
            style={{
              background: "#fff8e6",
              border: "1px solid #f0d089",
              color: "#8a5a00",
              padding: "1rem",
              borderRadius: 6,
            }}
          >
            {result.motivo ?? "O dado solicitado não existe no schema."}
          </p>
        </section>
      )}

      {result?.error && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ color: "#c00" }}>Erro</h3>
          <pre
            style={{
              background: "#fff0f0",
              color: "#c00",
              padding: "1rem",
              borderRadius: 6,
              overflowX: "auto",
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {result.error}
          </pre>
        </section>
      )}

      {result && !result.error && !result.refused && (
        <section style={{ marginTop: 24 }}>
          {result.premissa && (
            <p
              style={{
                fontSize: 13,
                color: "#555",
                background: "#eef4ff",
                border: "1px solid #cbd9f5",
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                marginBottom: 12,
              }}
            >
              <strong>Interpretei como:</strong> {result.premissa}
            </p>
          )}
          <h3>Resultados ({rows.length})</h3>
          {rows.length === 0 ? (
            <p style={{ color: "#777" }}>Nenhuma linha retornada.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c}
                        style={{
                          textAlign: "left",
                          borderBottom: "2px solid #ddd",
                          padding: "0.5rem",
                          background: "#fafafa",
                        }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td
                          key={c}
                          style={{
                            borderBottom: "1px solid #eee",
                            padding: "0.5rem",
                          }}
                        >
                          {formatCell(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
