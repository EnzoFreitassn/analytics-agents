import { prisma } from "./prisma";

/**
 * Executa o SQL em modo somente-leitura, dentro de uma transação:
 *  - SET LOCAL transaction_read_only = on  (bloqueia qualquer escrita)
 *  - SET LOCAL statement_timeout = '5s'    (mata consultas longas)
 * Usa $queryRawUnsafe porque o SQL é dinâmico (gerado pelo LLM).
 */
export async function runReadOnlyQuery(sql: string): Promise<unknown[]> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL transaction_read_only = on");
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '5s'");
    const rows = await tx.$queryRawUnsafe<unknown[]>(sql);
    return rows;
  });
}
