import { z } from "zod";

export const registerSchema = z.object({
  ownerName: z.string().trim().min(2, "Informe seu nome."),
  email: z.email("E-mail inválido."),
  password: z.string().min(8, "Mínimo de 8 caracteres."),
  shopName: z.string().trim().min(2, "Informe o nome da barbearia."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
