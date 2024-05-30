import { z } from "zod";
import type { FastifySchema } from "fastify";

const oauthSchema = z
  .object({
    email: z.string(),
    provider: z.enum(["facebook", "google"]),
    id: z.string(),
  })
  .array()
  .describe("Informações que recebemos do método de login oauth");

const usersInfoResponse = z
  .object({
    id: z.any(),
    oauth: oauthSchema,
    confirmed: z.boolean(),
    active: z.boolean(),
    email: z.string().email().optional(),
    ra: z.number().nullable(),
  })
  .describe("Informações do usuário da sessão");

/** Logged User */
export const usersInfoSchema = {
  tags: ["Users"],
  description: "Rotas para criação e manipulação da conta de um Usuário",
  response: {
    200: usersInfoResponse,
  },
} satisfies FastifySchema;

/** Resend email */
export const resendEmailSchema = {
  tags: ["Users"],
  description: "Rota para re-enviar e-mail em caso de não recebimento",
} satisfies FastifySchema;

/** Confirm User */
export const confirmUserSchema = {
  tags: ["Users"],
  description:
    "Rota que garante que o usuário conseguiu se cadastrar com oauth e assim realizar o envio de e-mail",
  response: {
    200: z.object({
      token: z.string().describe("Token da sessão do usuário"),
    }),
  },
} satisfies FastifySchema;

/**Complete user */
export const completeUserSchema = {
  tags: ["Users"],
  description:
    "Rota que finaliza o cadastro do usuário após o mesmo criar no link de confirmação do e-mail",
  response: {
    200: z.object({
      ra: z.number(),
      email: z.string().email(),
    }),
  },
} satisfies FastifySchema;

export const disableUserAccountSchema = {
  tags: ["Users"],
  description: "Rota para desativar a conta do usuário",
} satisfies FastifySchema;

export const setUserDeviceSchema = {
  tags: ["Users"],
  description: "Rota para definir o dispositivo do usuário",
} satisfies FastifySchema;

export const removeUserDeviceSchema = {
  tags: ["Users"],
  description: "Rota para remover o dispositivo do usuário",
} satisfies FastifySchema;

export const loginFacebookSchema = {
  tags: ["Users"],
  description: "Rota para login com Facebook",
} satisfies FastifySchema;
