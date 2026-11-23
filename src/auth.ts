import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import authConfig from "./auth.config";
import { authenticateOwner } from "@/modules/identity/application/use-cases/authenticate-owner";

declare module "next-auth" {
  interface Session {
    user: { id: string; tenantId: string } & DefaultSession["user"];
  }
  interface User {
    tenantId: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    tenantId?: string;
    ownerId?: string;
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        return authenticateOwner(parsed.data.email, parsed.data.password);
      },
    }),
  ],
});
