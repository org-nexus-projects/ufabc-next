import { z } from 'zod';

const emailSchema = z
  .string({
    invalid_type_error: 'Digite um email UFABC válido',
    required_error: 'Este campo é obrigatório',
  })
  .refine((email) => /^\S+$/u.test(email), 'Não digite espaços em branco');

const raFieldSchema = z
  .string({
    invalid_type_error: 'Digite um RA válido',
    required_error: 'Este campo é obrigatório',
  })
  .regex(/^\d+$/u, {
    message: 'Insira apenas números',
  })
  .refine(
    (ra) => ra.length >= 8,
    'O campo RA deve conter pelo menos 8 dígitos.'
  );

// Combined RA and confirmation schema
const raSchema = z
  .object({
    confirm: z.string({
      invalid_type_error: 'Digite um RA válido',
      required_error: 'Este campo é obrigatório',
    }),
    ra: raFieldSchema,
  })
  .refine((data) => data.ra === data.confirm, {
    message: 'Os campos RA devem ser iguais',
    path: ['confirm'],
  });

const termsSchema = z.boolean().refine((accepted) => accepted, {
  message: 'Você precisa aceitar os termos de uso',
});

export const SignUpSchema = z.object({
  check: termsSchema,
  email: emailSchema,
  ra: raSchema,
});
