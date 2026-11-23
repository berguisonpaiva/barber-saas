import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, TooManyRequestsError } from "./app-error";

/** Converte qualquer erro em resposta JSON padronizada para Route Handlers. */
export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", issues: error.issues } },
      { status: 422 },
    );
  }
  if (error instanceof AppError) {
    const headers: Record<string, string> = {};
    if (error instanceof TooManyRequestsError) headers["Retry-After"] = String(error.retryAfterSeconds);
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.httpStatus, headers },
    );
  }
  console.error("[unhandled]", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Erro inesperado." } },
    { status: 500 },
  );
}
