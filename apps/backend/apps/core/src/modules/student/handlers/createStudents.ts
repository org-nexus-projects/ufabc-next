import { currentQuad, lastQuad } from '@next/common';
import { get as LodashGet } from 'lodash-es';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { StudentModel } from '@/models/Student.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

type Curso = {
  curso_id: number;
  curso: string;
  cp: number;
  cr: number;
  quads: number;
  nome_curso: string;
  ind_afinidade: number;
};

type CreateStudentsRequest = {
  Body: {
    aluno_id: number;
    ra: number;
    login: string;
    cursos: Array<Curso>;
  };
};

export async function createStudents(
  request: FastifyRequest<CreateStudentsRequest>,
  reply: FastifyReply,
) {
  const { aluno_id, login, ra } = request.body;

  if (!aluno_id) {
    reply.badRequest('Missing aluno_id');
  }

  const season = currentQuad();
  const Students = StudentModel.find({
    season,
  });
  const Disciplinas = DisciplinaModel.find({
    season,
  });

  // check if already passed, if so does no update this user anymore
  const isPrevious = await Disciplinas.countDocuments({
    before_kick: { $exists: true, $ne: [] },
  });

  if (isPrevious) {
    return Students.findOne({ aluno_id });
  }

  const isCourseValid = !hasInvalidCourse(request.body.cursos || []) || !ra;

  if (isCourseValid) {
    return Students.findOne({
      aluno_id,
    });
  }

  const courses = (request.body.cursos || []).map(async (course) => {
    let cleanedCourse = course.curso
      .trim()
      .replace('↵', '')
      .replaceAll(/\s+/g, ' ');
    if (cleanedCourse === 'Bacharelado em CIências e Humanidades') {
      cleanedCourse = 'Bacharelado em Ciências e Humanidades';
    }

    // sort by most recent
    const studentHistoryGraduation = await GraduationHistoryModel.findOne({
      ra,
      curso: cleanedCourse,
    }).sort({ updatedAt: -1 });

    const cpBeforePandemic: number | null = LodashGet(
      studentHistoryGraduation,
      'coefficients.2019.3.cp_acumulado',
      null,
    );
    // Sum cp before pandemic + cp after freezed
    const cpFreezed: number | null = LodashGet(
      studentHistoryGraduation,
      'coefficients.2021.2.cp_acumulado',
      null,
    );

    const pastQuad = lastQuad();
    const cpPastQuad: number | null = LodashGet(
      studentHistoryGraduation,
      `coefficients.${pastQuad.year}.${pastQuad.quad}.cp_acumulado`,
      null,
    );

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const twoQuadAgo = lastQuad(threeMonthsAgo);
    const cpTwoQuadsAgo = LodashGet(
      history,
      `coefficients.${twoQuadAgo.year}.${twoQuadAgo.quad}.cp_acumulado`,
      null,
    );

    let cpTotal = null;

    if ((cpPastQuad || cpTwoQuadsAgo) && cpFreezed) {
      cpTotal = (cpPastQuad! || cpTwoQuadsAgo!) - cpFreezed;
    }

    let finalCp = null;
    // If student enter after 2019.3
    if (!cpBeforePandemic) {
      if (!cpTotal) {
        cpTotal = course.cp;
      }
      finalCp = Math.min(Number(cpTotal.toFixed(3)), 1);
    } else {
      finalCp = Math.min(Number((cpBeforePandemic + cpTotal!).toFixed(3)), 1);
    }

    // @ts-expect-error typecasting
    course.cr = Number.isFinite(course.cr) ? toNumber(course.cr) : 0;
    // @ts-expect-error typecasting
    course.cp = Number.isFinite(course.cp) ? toNumber(finalCp) : 0;
    // @ts-expect-error typecasting
    course.quads = Number.isFinite(course.quads) ? toNumber(course.quads) : 0;

    course.nome_curso = cleanedCourse;
    // refer
    // https://www.ufabc.edu.br/administracao/conselhos/consepe/resolucoes/resolucao-consepe-no-147-define-os-coeficientes-de-desempenho-utilizados-nos-cursos-de-graduacao-da-ufabc
    course.ind_afinidade =
      0.07 * course.cr + 0.63 * course.cp + 0.005 * course.quads;

    if (
      !course.curso_id &&
      course.curso === 'Bacharelado em Ciências e Humanidades'
    ) {
      course.curso_id = 25;
    }

    request.log.info(course);
    return course;
  });

  return Students.findOneAndUpdate(
    {
      aluno_id,
    },
    {
      cursos: await Promise.all(courses),
      ra,
      login,
    },
    {
      new: true,
      upsert: true,
    },
  );
}

const hasInvalidCourse = (cursos: CreateStudentsRequest['Body']['cursos']) => {
  return cursos.some((curso) => {
    return (
      (!curso.curso_id || curso.curso_id === null) &&
      curso.curso !== 'Bacharelado em CIências e Humanidades' &&
      curso.curso !== 'Bacharelado em Ciências e Humanidades'
    );
  });
};

const toNumber = (str: string) => {
  if (typeof str === 'number') {
    return str;
  }
  return Number.parseFloat((str || '').replace(',', '.'));
};
