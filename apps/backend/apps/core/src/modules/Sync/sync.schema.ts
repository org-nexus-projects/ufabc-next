import type { FastifySchema } from 'fastify';

export const syncEnrolledSchema = {
  tags: ['Sync'],
  description: 'Rota para sincronizar matrículas',
} satisfies FastifySchema;

export const syncEnrollmentsSchema = {
  tags: ['Sync'],
  description: 'Rota para sincronizar inscrições',
} satisfies FastifySchema;

export const syncComponentsTeacherSchema = {
  tags: ['Sync'],
  description: 'Rota para analisar e sincronizar professores em disciplinas',
} satisfies FastifySchema;
