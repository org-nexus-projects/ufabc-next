import { z } from 'zod';

export const facebookValidationSchema = z.object({
  email: z
    .string({
      required_error: 'Este campo é obrigatório',
      invalid_type_error: 'Digite um email válido',
    })
    .email({
      message: 'Por favor, digite um email válido',
    }),
  ra: z.string({ required_error: 'Este campo é obrigatório' }),
});
