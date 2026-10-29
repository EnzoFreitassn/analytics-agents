import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fixa a raiz de rastreio no projeto. Sem isto, o Next detecta um lockfile
  // solto em C:\Users\Enzo e tenta rastrear o diretório inteiro do usuário,
  // o que falha em readlink sobre os placeholders de nuvem do OneDrive.
  outputFileTracingRoot: path.resolve(),
  // @xenova/transformers só é usado quando USE_RAG=true (import dinâmico).
  // Mantê-lo externo evita que o bundler do servidor tente empacotar seus
  // binários/wasm no build do baseline.
  serverExternalPackages: ["@xenova/transformers"],
};

export default nextConfig;
