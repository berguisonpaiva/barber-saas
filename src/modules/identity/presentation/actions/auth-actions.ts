"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { AppError } from "@/shared/errors/app-error";
import { registerOwner } from "../../application/use-cases/register-owner";
import { registerSchema } from "../schemas/register";

export type FormState = { error?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/painel/agenda",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "E-mail ou senha incorretos." };
    throw error; // inclui o redirect do Next
  }
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await registerOwner(parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/painel/assinatura",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
