import { courseId, type currentQuad } from '@next/common';
import { type Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
import { type Student, StudentModel } from '@/models/Student.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FilterQuery } from 'mongoose';

type Season = ReturnType<typeof currentQuad>;

type DisciplinaStatsRequest = {
  Querystring: {
    season: Season;
    turno: 'noturno' | 'diurno';
    curso_id: number;
    ratio: number;
    limit: number;
    page: number;
  };
  Params: {
    action: 'overview' | 'disciplines' | 'courses';
  };
};

export class DisciplinaStatsHandler {
  async disciplinaStats(
    request: FastifyRequest<DisciplinaStatsRequest>,
    reply: FastifyReply,
  ) {
    const { action } = request.params;
    const { season, turno, curso_id, ratio, limit, page } = Object.assign(
      request.query,
      {
        limit: 10,
        page: 0,
      },
    );

    if (!season) {
      return reply.badRequest('Missing season');
    }

    // check if query has been made
    const match: FilterQuery<Disciplina> = {
      season,
    };

    if (turno) {
      match.turno = turno;
    }

    if (curso_id) {
      // get interCourseIds
      const interIds = [
        await courseId<Student>(
          'Bacharelado em Ciência e Tecnologia',
          season,
          StudentModel,
        ),
        await courseId<Student>(
          'Bacharelado em Ciências e Humanidades',
          season,
          StudentModel,
        ),
      ];
      match.obrigatorias = { $in: [curso_id] };

      // if passed course is not a BI, take BIs off query
      if (!interIds.includes(curso_id)) {
        match.obrigatorias.$nin = interIds;
      }
    }

    // check if we are dealing with previous data or current
    const isPrevious = await DisciplinaModel.countDocuments({
      season,
      before_kick: { $exists: true, $ne: [] },
    });
    const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

    const stats = DisciplinaModel.aggregate([
      {
        $match: { match },
      },
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
      ...(ratio !== null ? [{ $match: { ratio: { $gt: ratio } } }] : []),
      ...(action === 'overview'
        ? [
            {
              $group: {
                _id: null,
                vagas: { $sum: '$vagas' },
                requisicoes: { $sum: '$requisicoes' },
                deficit: { $sum: '$deficit' },
              },
            },
          ]
        : action === 'disciplines'
          ? [
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
            ]
          : action === 'courses'
            ? [
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
              ]
            : []),
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
    ]);

    return stats;
  }
}
