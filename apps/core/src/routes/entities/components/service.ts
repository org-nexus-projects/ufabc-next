import type { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';

import { httpErrors } from '@fastify/sensible';
import { currentQuad } from '@next/utils';
import { orderBy as LodashOrderBy } from 'lodash-es';

import type { SubjectDocument } from '@/models/Subject.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import type { NonPaginatedComponents } from '@/schemas/entities/components.js';

import { LegacyBodyError } from '@/errors/custom-errors.js';
import { type Component, ComponentModel } from '@/models/Component.js';
import { StudentModel } from '@/models/Student.js';

export async function findTeachers(subject: Types.ObjectId, season: string) {
  const teachers = await ComponentModel.find({ subject, season })
    .populate(['pratica', 'teoria'])
    .lean<{ teoria: TeacherDocument; pratica: TeacherDocument }[]>();

  return teachers;
}

export async function listLegacyComponents(request: FastifyRequest) {
  const { season: requestedSeason } = request.query as { season?: string };
  const season = requestedSeason ?? currentQuad();
  const cacheKey = `list:components:legacy:${season}`;

  const cachedResponse =
    await request.redisService.getJSON<NonPaginatedComponents[]>(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const components = await ComponentModel.find(
    { season },
    {
      _id: 0,
      codigo: 1,
      alunos_matriculados: 1,
      uf_cod_turma: 1,
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
    }
  )
    .populate<{
      pratica: TeacherDocument;
      teoria: TeacherDocument;
      subject: SubjectDocument;
    }>(['pratica', 'teoria', 'subject'])
    .lean();

  const nonPaginatedComponents = components.map((component) => ({
    ...component,
    uf_cod_turma: component.uf_cod_turma,
    requisicoes: component.alunos_matriculados?.length ?? 0,
    teoria: component.teoria?.name,
    pratica: component.pratica?.name,
    subject: component.subject?.name,
    subjectId: component.subject?._id.toString(),
    teoriaId: component.teoria?._id.toString(),
    praticaId: component.pratica?._id.toString(),
  }));

  await request.redisService.setJSON(cacheKey, nonPaginatedComponents, '5m');

  return nonPaginatedComponents;
}

export async function listKickedStudents(request: FastifyRequest) {
  const query = request.query as {
    season: string;
    sort?: 'reserva' | 'turno' | 'ik' | 'cp' | 'cr';
  };
  const params = request.params as { componentId: number };

  const component = await ComponentModel.findOne({
    season: query.season,
    disciplina_id: params.componentId,
  }).lean();

  if (!component) {
    throw httpErrors.badRequest('Component not found');
  }

  // if a sort param has not been passed uses ideal_quad
  const kicks = query.sort
    ? [query.sort]
    : kickRule(component.ideal_quad, query.season);

  const kicksOrder = kicks.map((kick) =>
    kick === 'turno' ? (component.turno === 'diurno' ? 'asc' : 'desc') : 'desc'
  );

  const isAfterKick = component.after_kick
    ? component.after_kick.length > 0
    : false;

  const resolveKicked = resolveEnrolled(component, isAfterKick);

  const kicksMap = new Map(
    resolveKicked.map((kicked) => [kicked.studentId, kicked])
  );

  const students = await StudentModel.aggregate([
    {
      $match: {
        season: query.season,
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
        season: query.season,
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
    interCourseIds
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
      ...kickedInfo,
    };

    return graduationToStudent;
  });

  const sortedStudents = LodashOrderBy(
    studentsWithGraduation,
    kicks,
    kicksOrder
  );

  const uniqueStudents = Array.from(
    new Map(
      sortedStudents.map((student) => [student.studentId, student])
    ).values()
  );

  return uniqueStudents;
}

export async function updateGroupUrls(
  request: FastifyRequest,
  reply: FastifyReply,
  log: FastifyBaseLogger
) {
  const { originKey } = request.params as { originKey: string };
  const { season } = request.query as { season?: string };
  const { groupURL } = request.body as { groupURL: string | null };

  if (groupURL === undefined) {
    throw httpErrors.badRequest('groupURL in request body is required');
  }

  if (groupURL !== null && typeof groupURL !== 'string') {
    throw httpErrors.badRequest('groupURL must be a string or null');
  }

  try {
    log.info({ originKey, season, groupURL }, 'Updating groupURL');

    const seasonToUse = season ?? currentQuad();

    const result = await ComponentModel.updateOne(
      { origin_key: originKey, season },
      { $set: { groupURL } }
    );

    if (result.matchedCount === 0) {
      log.info({ originKey, season: seasonToUse }, 'No matching component found');
      throw new LegacyBodyError('No matching component found', 404, {
        error: 'No matching component found',
        originKey,
        season: seasonToUse,
      });
    }

    if (result.modifiedCount === 0) {
      log.info(
        { originKey, season: seasonToUse },
        'Component found but not modified (same groupURL)'
      );
      return reply.send({
        message: 'Component found but groupURL was already set to this value',
        originKey,
        season: seasonToUse,
        groupURL,
      });
    }

    log.info(
      {
        originKey,
        season: seasonToUse,
        modifiedCount: result.modifiedCount,
      },
      'GroupURL updated successfully'
    );

    return reply.send({
      message: 'GroupURL updated successfully',
      originKey,
      season: seasonToUse,
      groupURL,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error instanceof LegacyBodyError) {
      throw error;
    }

    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        originKey,
        season: season,
      },
      'Error updating groupURL'
    );
    throw httpErrors.internalServerError('Error updating groupURL');
  }
}

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
  filterList: number[]
) {
  const removeSet = new Set(filterList);
  return obrigatorias.filter((obrigatoria) => !removeSet.has(obrigatoria));
}
