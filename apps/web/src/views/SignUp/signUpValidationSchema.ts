import { z } from 'zod';

const emailSchema = z
  .string({
    required_error: 'Este campo é obrigatório',
    invalid_type_error: 'Digite um email UFABC válido',
  })
  .refine((email) => /^\S+$/.test(email), 'Não digite espaços em branco');

const raFieldSchema = z
  .string({
    required_error: 'Este campo é obrigatório',
    invalid_type_error: 'Digite um RA válido',
  })
  .regex(/^\d+$/, {
    message: 'Insira apenas números',
  })
  .refine(
    (ra) => ra.length >= 8,
    'O campo RA deve conter pelo menos 8 dígitos.',
  );

// Combined RA and confirmation schema
const raSchema = z
  .object({
    ra: raFieldSchema,
    confirm: z.string({
      required_error: 'Este campo é obrigatório',
      invalid_type_error: 'Digite um RA válido',
    }),
  })
  .refine((data) => data.ra === data.confirm, {
    message: 'Os campos RA devem ser iguais',
    path: ['confirm'],
  });

const termsSchema = z.boolean().refine((accepted) => accepted === true, {
  message: 'Você precisa aceitar os termos de uso',
});

export const SignUpSchema = z.object({
  email: emailSchema,
  ra: raSchema,
  check: termsSchema,
});
