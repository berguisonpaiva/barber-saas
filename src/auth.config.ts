import type { NextAuthConfig } from "next-auth";

/**
 * Configuração compartilhada e SEM banco (pode rodar no proxy).
 * O provider de credenciais (que consulta o Postgres) fica em auth.ts.
 */
export default {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isPanel = request.nextUrl.pathname.startsWith("/painel");
      if (isPanel) return !!auth?.user?.tenantId;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
        token.ownerId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.ownerId as string;
      session.user.tenantId = token.tenantId as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
