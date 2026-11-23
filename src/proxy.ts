import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Next.js 16: "middleware" agora se chama "proxy".
// Usa a config sem banco; a checagem definitiva fica na camada de dados (requireOwner).
const { auth } = NextAuth(authConfig);

// next-auth 5.0.0-beta.32 aceita auth(request, event) em proxy e redireciona para o login
// (lib/index.js, ramo "middleware.ts inline"), mas não declara essa assinatura nos tipos.
const authProxy = auth as unknown as NextMiddleware;

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return authProxy(request, event);
}

export const config = {
  matcher: ["/painel/:path*"],
};
