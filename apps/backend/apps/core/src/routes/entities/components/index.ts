import { orderBy as LodashOrderBy } from 'lodash-es';
import { type Component, ComponentModel } from '@/models/Component.js';
import { StudentModel } from '@/models/Student.js';
import {
  listKickedSchema,
  type NonPaginatedComponents,
} from '@/schemas/entities/components.js';
import type { preHandlerAsyncHookHandler } from 'fastify';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import type { SubjectDocument } from '@/models/Subject.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import { currentQuad } from '@next/common';

const validateStudent: preHandlerAsyncHookHandler = async (request, reply) => {
  const { studentId, season } = request.query as {
    studentId: number;
    season: string;
  };
  const student = await StudentModel.findOne({
    season,
    aluno_id: studentId,
  });

  if (!student) {
    return reply.forbidden('StudentId');
  }

  return;
};

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const componentsListCache = app.cache<NonPaginatedComponents[]>();

  app.get('/', async (request, reply) => {
    // @ts-ignore
    const cacheKey = `list:components:${request.query.season}`;

    const cachedResponse = componentsListCache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const components = await ComponentModel.find(
      {
        // @ts-ignore
        season: request.query.season ?? currentQuad(),
      },
      {
        _id: 0,
        alunos_matriculados: 1,
        campus: 1,
        pratica: 1,
        teoria: 1,
        vagas: 1,
        subject: 1,
        identifier: 1,
        ideal_quad: 1,
        turma: 1,
        turno: 1,
        disciplina_id: 1,
        season: 1,
      },
    )
      .populate<{
        pratica: TeacherDocument;
        teoria: TeacherDocument;
        subject: SubjectDocument;
      }>(['pratica', 'teoria', 'subject'])
      .lean();

    const nonPaginatedComponents = components.map((component) => ({
      ...component,
      requisicoes: component.alunos_matriculados.length ?? [],
      teoria: component.teoria?.name,
      pratica: component.pratica?.name,
      subject: component.subject?.name,
      subjectId: component.subject?._id.toString(),
      teoriaId: component.teoria?._id.toString(),
      praticaId: component.pratica?._id.toString(),
    }));

    componentsListCache.set(cacheKey, nonPaginatedComponents);

    return nonPaginatedComponents;
  });
  app.get(
    '/:componentId/kicks',
    { preHandler: [validateStudent], schema: listKickedSchema },
    async (request, reply) => {
      const component = await ComponentModel.findOne({
        season: request.query.season,
        disciplina_id: request.params.componentId,
      }).lean();

      if (!component) {
        return reply.badRequest('Component not found');
      }

      // if a sort param has not been passed uses ideal_quad
      const kicks = request.query.sort
        ? [request.query.sort]
        : kickRule(component.ideal_quad, request.query.season);

      const kicksOrder = kicks.map((kick) =>
        kick === 'turno'
          ? component.turno === 'diurno'
            ? 'asc'
            : 'desc'
          : 'desc',
      );

      const isAfterKick = component.after_kick
        ? component.after_kick.length > 0
        : false;

      const resolveKicked = resolveEnrolled(component, isAfterKick);

      const kicksMap = new Map(
        resolveKicked.map((kicked) => [kicked.studentId, kicked]),
      );

      const students = await StudentModel.aggregate([
        {
          $match: {
            season: request.query.season,
            aluno_id: { $in: resolveKicked.map((kicked) => kicked.studentId) },
          },
        },
        { $unwind: '$cursos' },
      ]);

      const courses = await StudentModel.aggregate<{
        _id: string;
        ids: number[];
      }>([
        {
          $unwind: '$cursos',
        },
        {
          $match: {
            'cursos.id_curso': {
              $ne: null,
            },
            season: request.query.season,
          },
        },
        {
          $project: {
            'cursos.id_curso': 1,
            'cursos.nome_curso': {
              $trim: {
                input: '$cursos.nome_curso',
              },
            },
          },
        },
        {
          $group: {
            _id: '$cursos.nome_curso',
            ids: {
              $addToSet: '$cursos.id_curso',
            },
          },
        },
      ]);

      const interCourses = [
        'Bacharelado em Ciência e Tecnologia',
        'Bacharelado em Ciências e Humanidades',
      ];

      const interCourseIds = courses
        .filter(({ _id: name }) => interCourses.includes(name))
        .flatMap(({ ids }) => ids);

      const obrigatorias = getObrigatoriasFromComponents(
        component.obrigatorias,
        interCourseIds,
      );

      const studentsWithGraduation = students.map((student) => {
        const reserva = obrigatorias.includes(student.cursos.id_curso);
        const kickedInfo = kicksMap.get(student.aluno_id);
        const graduationToStudent = {
          studentId: student.aluno_id,
          cr: '-',
          cp: student.cursos.cp,
          ik: reserva ? student.cursos.ind_afinidade : 0,
          reserva,
          turno: student.cursos.turno,
          curso: student.cursos.nome_curso,
          ...(kickedInfo || {}),
        };

        return graduationToStudent;
      });

      const sortedStudents = LodashOrderBy(
        studentsWithGraduation,
        kicks,
        kicksOrder,
      );

      const uniqueStudents = Array.from(
        new Map(
          sortedStudents.map((student) => [student.studentId, student]),
        ).values(),
      );

      return uniqueStudents;
    },
  );
};

function kickRule(idealQuad: boolean, season: string) {
  let coeffRule = null;
  if (
    season === '2020:2' ||
    season === '2020:3' ||
    season === '2021:1' ||
    season === '2021:2' ||
    season === '2021:3' ||
    season === '2022:1' ||
    season === '2022:2' ||
    season === '2022:3' ||
    season === '2023:1' ||
    season === '2023:2' ||
    season === '2023:3' ||
    season === '2024:1' ||
    season === '2024:2' ||
    season === '2024:3' ||
    season === '2025:1'
  ) {
    coeffRule = ['cp', 'cr'];
  } else {
    coeffRule = idealQuad ? ['cr', 'cp'] : ['cp', 'cr'];
  }

  return ['reserva', 'turno', 'ik'].concat(coeffRule);
}

function resolveEnrolled(component: Component, isAfterKick: boolean) {
  const {
    after_kick: afterKick,
    alunos_matriculados: enrolledStudentsIds,
    before_kick: beforeKick,
  } = component;

  // if kick has not arrived, no one has been kicked
  if (!isAfterKick) {
    const registeredStudentsIds = enrolledStudentsIds || [];
    return registeredStudentsIds.map((id) => ({
      studentId: id,
    }));
  }

  const kicked = beforeKick.filter((kick) => !afterKick.includes(kick));
  return beforeKick.map((id) => ({
    studentId: id,
    kicked: kicked.includes(id),
  }));
}

/**
 * @description this code is incorrect, since currently we save ids
 * that contains this component as 'limitada'
 */
function getObrigatoriasFromComponents(
  obrigatorias: number[],
  filterList: number[],
) {
  const removeSet = new Set(filterList);
  return obrigatorias.filter((obrigatoria) => !removeSet.has(obrigatoria));
}

export default plugin;
