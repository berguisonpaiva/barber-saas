/** Erro de aplicação com código estável e status HTTP sugerido. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly httpStatus = 400,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos.", readonly issues?: unknown) {
    super(message, "VALIDATION_ERROR", 422);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Não encontrado.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, code, 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado.") {
    super(message, "FORBIDDEN", 403);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(readonly retryAfterSeconds: number) {
    super("Muitas tentativas. Tente novamente em instantes.", "RATE_LIMITED", 429);
  }
}
