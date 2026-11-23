import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Next.js 16: "middleware" agora se chama "proxy".
// Usa a config sem banco; a checagem definitiva fica na camada de dados (requireOwner).
export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: ["/painel/:path*"],
};
