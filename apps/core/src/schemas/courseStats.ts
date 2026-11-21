import type { FastifySchema } from 'fastify';
import { z } from 'zod';

const tags = ['CourseStats'];

const crDistributionSchema = z.object({
  _id: z.string(),
  total: z.number(),
  point: z.string(),
});

export const seasonStatsSchema = z.object({
  ca_quad: z.number(),
  ca_acumulado: z.number(),
  cr_quad: z.number(),
  cr_acumulado: z.number(),
  cp_acumulado: z.number(),
  percentage_approved: z.number(),
  accumulated_credits: z.number(),
  period_credits: z.number(),
  season: z.string(),
  quad: z.number(),
  year: z.number(),
});

export type CRDistribution = z.infer<typeof crDistributionSchema>;

export const gradesStatsSchema = {
  tags,
  response: {
    200: crDistributionSchema.array(),
  },
} satisfies FastifySchema;

export const userGradesSchema = {
  tags,
  response: {
    200: seasonStatsSchema.array(),
  },
} satisfies FastifySchema;
