// Converte os resultados crus do Postgres para algo serializável em JSON.
// - BigInt (ex: COUNT(*)) vira number
// - Decimal (preços, somas) vira number
// - Date é tratada pelo JSON padrão (ISO string)

function isDecimal(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  );
}

export function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (isDecimal(value)) {
    return value.toNumber();
  }
  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = toJsonSafe(v);
    }
    return out;
  }
  return value;
}
