import { z } from 'zod';

const UFABC_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@(aluno\.)?ufabc\.edu\.br$/;

export const recoverySchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Este campo é obrigatório'
          : 'Digite um email válido',
    })
    .email('Formato de email inválido')
    .refine(
      (email) => UFABC_EMAIL_REGEX.test(email),
      'Digite um email UFABC válido (domínios @aluno.ufabc.edu.br ou @ufabc.edu.br)'
    ),
});
