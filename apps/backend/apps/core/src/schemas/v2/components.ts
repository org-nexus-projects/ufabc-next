import { Types } from 'mongoose';
import { z } from 'zod';

import { Component } from '@/models/Component.js';

export const componentArchiveSchema = z
  .object({
    viewurl: z.string().url(),
    fullname: z.string(),
    id: z.number(),
  })
  .array();

export interface PopulatedComponent extends Omit<
  Component,
  'teoria' | 'pratica' | 'subject'
> {
  teoria: { _id: Types.ObjectId; name: string } | null;
  pratica: { _id: Types.ObjectId; name: string } | null;
  subject: { _id: Types.ObjectId; name: string } | null;
}

export const listComponentItemSchema = z.object({
  identifier: z.string().nullable(),
  disciplina_id: z.number().nullable(),
  subject: z.string(),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number(),
  requisicoes: z.number(),
  campus: z.enum(['sao bernardo', 'santo andre', 'sbc', 'sa']),
  teoria: z.string().nullable(),
  pratica: z.string().nullable(),
  teoriaId: z.string().nullable(),
  praticaId: z.string().nullable(),
  season: z.string(),
  groupURL: z.string().nullable(),
  uf_cod_turma: z.string(),
  subjectId: z.string(),
});

export const listComponentsSchema = z.array(listComponentItemSchema);

export type ListComponent = z.infer<typeof listComponentItemSchema>;
