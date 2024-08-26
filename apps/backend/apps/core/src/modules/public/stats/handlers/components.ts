import { ComponentModel, type Component } from '@/models/Component.js';
import { StudentModel, type Student } from '@/models/Student.js';
import { currentQuad, courseId as findCourseId } from '@next/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Aggregate, AggregateOptions, FilterQuery } from 'mongoose';
import { z } from 'zod';

type Season = ReturnType<typeof currentQuad>;

const validatedQueryParams = z.object({
  season: z.string().optional().default(currentQuad()),
  turno: z.string().optional(),
  courseId: z.coerce.number().int().optional(),
  ratio: z.coerce.number().optional(),
  limit: z.coerce.number().optional().default(10),
  page: z.coerce.number().optional().default(0),
});

const validatedRouteParams = z.object({
  action: z
    .union([
      z.literal('overview'),
      z.literal('component'),
      z.literal('courses'),
    ])
    .optional(),
});

type Param = z.infer<typeof validatedRouteParams>;

export async function componentStats(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { action } = validatedRouteParams.parse(request.params);
  const { season, turno, courseId, ratio, limit, page } =
    validatedQueryParams.parse(request.query);

  const match: FilterQuery<Component> = { season };

  if (courseId) {
    const interIds = [
      await findCourseId<Student>(
        'Bacharelado em Ciência e Tecnologia',
        season as Season,
        StudentModel,
      ),
      await findCourseId<Student>(
        'Bacharelado em Ciências e Humanidades',
        season as Season,
        StudentModel,
      ),
    ];
    match.obrigatorias = { $in: [courseId] };

    if (!interIds.includes(courseId)) {
      match.obrigatorias.$nin = interIds;
    }
  }

  const isPrevious = await ComponentModel.countDocuments({
    season,
    before_kick: { $exists: true, $ne: [] },
  });
  const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

  const pipeline: any = [
    { $match: match },
    {
      $project: {
        vagas: 1,
        turno: 1,
        codigo: 1,
        disciplina: 1,
        obrigatorias: 1,
        turma: 1,
        requisicoes: { $size: { $ifNull: [dataKey, []] } },
      },
    },
    { $match: { vagas: { $gt: 0 } } },
    {
      $project: {
        vagas: 1,
        turno: 1,
        codigo: 1,
        disciplina: 1,
        obrigatorias: 1,
        requisicoes: 1,
        turma: 1,
        deficit: { $subtract: ['$requisicoes', '$vagas'] },
        ratio: { $divide: ['$requisicoes', '$vagas'] },
      },
    },
  ];

  if (ratio) {
    pipeline.push({ $match: { ratio: { $gt: ratio } } });
  }

  pipeline.push(...resolveStep(action, turno, courseId));

  pipeline.push(
    {
      $facet: {
        total: [{ $count: 'total' }],
        data: [
          { $sort: { [ratio != null ? 'ratio' : 'deficit']: -1 } },
          { $skip: page * limit },
          { $limit: limit },
          {
            $project: {
              codigo: 1,
              disciplina: 1,
              turma: 1,
              turno: 1,
              vagas: 1,
              requisicoes: 1,
              deficit: 1,
              ratio: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
        page,
      },
    },
    {
      $project: {
        total: 1,
        data: 1,
        page: 1,
      },
    },
  );

  const [result] = await ComponentModel.aggregate(pipeline);
  return result;
}

function resolveStep(
  action: Param['action'],
  turno?: string,
  courseId?: number,
) {
  switch (action) {
    case 'overview':
      return getOverviewSteps();
    case 'component':
      return getDisciplineSteps();
    case 'courses':
      return getCourseSteps(turno, courseId);
    default:
      return [];
  }
}

function getOverviewSteps() {
  return [
    {
      $group: {
        _id: null,
        vagas: { $sum: '$vagas' },
        requisicoes: { $sum: '$requisicoes' },
        deficit: { $sum: '$deficit' },
      },
    },
  ];
}

function getDisciplineSteps() {
  return [
    {
      $group: {
        _id: '$codigo',
        disciplina: { $first: '$disciplina' },
        vagas: { $sum: '$vagas' },
        requisicoes: { $sum: '$requisicoes' },
      },
    },
    {
      $project: {
        disciplina: 1,
        vagas: 1,
        requisicoes: 1,
        codigo: 1,
        deficit: { $subtract: ['$requisicoes', '$vagas'] },
        ratio: { $divide: ['$requisicoes', '$vagas'] },
      },
    },
  ];
}

function getCourseSteps(turno?: string, courseId?: number) {
  const match: FilterQuery<Component> = {};
  if (turno) {
    match.turno = turno;
  }
  if (courseId) {
    match.obrigatorias = courseId;
  }

  return [
    { $unwind: '$obrigatorias' },
    { $match: match },
    {
      $group: {
        _id: '$obrigatorias',
        obrigatorias: { $first: '$obrigatorias' },
        disciplina: { $first: '$disciplina' },
        vagas: { $sum: '$vagas' },
        requisicoes: { $sum: '$requisicoes' },
      },
    },
    {
      $project: {
        vagas: 1,
        requisicoes: 1,
        deficit: { $subtract: ['$requisicoes', '$vagas'] },
        ratio: { $divide: ['$requisicoes', '$vagas'] },
      },
    },
  ];
}
