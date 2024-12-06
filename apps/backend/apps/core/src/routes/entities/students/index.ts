import { ComponentModel } from '@/models/Component.js';
import {
  createStudentSchema,
  listStudentSchema,
  listStudentsStatsComponents,
} from '@/schemas/entities/students.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  getAllCourses,
  getComponentsStudentsStats,
  getStudent,
  getGraduation,
  createOrInsert,
} from './service.js';
import { currentQuad, lastQuad } from '@next/common';
import { type Student, StudentModel } from '@/models/Student.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/stats/components',
    { schema: listStudentsStatsComponents },
    async (request, reply) => {
      const { season } = request.query;

      const isPrevious = await ComponentModel.countDocuments({
        season,
        before_kick: { $exists: true, $ne: [] },
      });

      const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';
      const statusAggregate = await getComponentsStudentsStats(season, dataKey);

      return statusAggregate;
    },
  );

  app.get('/courses', async () => {
    const allStudentsCourses = await getAllCourses();
    return allStudentsCourses;
  });

  app.get('/', { schema: listStudentSchema }, async ({ user }, reply) => {
    const student = await getStudent({ ra: user.ra });

    if (!student) {
      return reply.badRequest('Student not found');
    }

    return {
      studentId: student.aluno_id,
      login: student.login,
    };
  });

  app.get('/student', async (request, reply) => {
    const { ra, login } = request.query;
    const student = await getStudent({ ra, login });
    return student;
  });

  app.post('/', { schema: createStudentSchema }, async (request, reply) => {
    const { studentId, graduations, ra, login } = request.body;

    if (!studentId) {
      return reply.badRequest('Missing studentId');
    }

    const season = currentQuad();
    const isPrevious = await ComponentModel.countDocuments({
      before_kick: { $exists: true, $ne: [] },
      season,
    });

    if (isPrevious) {
      // past student, do not update anymore
      const student = await StudentModel.findOne({
        season,
        aluno_id: studentId,
      }).lean<Student>();
      return student;
    }

    const isMissingCourseId = graduations.some((g) => g.courseId == null);

    if (isMissingCourseId || !ra) {
      // called by snapshot page
      const student = await StudentModel.findOne({
        aluno_id: studentId,
      }).lean<Student>();

      return student;
    }

    const studentGraduationsPromises = graduations.map(async (g) => {
      const history = await getGraduation(ra, g.name);

      const cpBeforePandemic = history?.coefficients?.[2019]?.[3].cp_acumulado;
      // Sum cp before pandemic + cp after freezed
      const cpFreezed = history?.coefficients?.[2021]?.[2].cp_acumulado;

      const { quad, year } = lastQuad();
      const cpPastQuad = history?.coefficients?.[year]?.[quad].cp_acumulado;

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const twoQuadAgoSeason = lastQuad(threeMonthsAgo);
      const cpTwoQuadsAgo =
        history?.coefficients?.[twoQuadAgoSeason.year]?.[twoQuadAgoSeason.quad]
          .cp_acumulado;

      let cpTotal = null;
      if ((cpPastQuad || cpTwoQuadsAgo) && cpFreezed) {
        cpTotal = (cpPastQuad! || cpTwoQuadsAgo!) - cpFreezed;
      }

      let finalCp = null;
      // If student enter after 2019.3
      if (!cpBeforePandemic) {
        if (!cpTotal) {
          cpTotal = g.cp;
        }
        finalCp = Math.min(Number(cpTotal?.toFixed(3)), 1);
      } else {
        finalCp = Math.min(Number((cpBeforePandemic + cpTotal!).toFixed(3)), 1);
      }

      g.cr = Number.isFinite(g.cr) ? g.cr : 0;
      g.cp = Number.isFinite(g.cp) ? finalCp : 0;
      g.quads = Number.isFinite(g.quads) ? g.quads : 0;

      // refer
      // https://www.ufabc.edu.br/administracao/conselhos/consepe/resolucoes/resolucao-consepe-no-147-define-os-coeficientes-de-desempenho-utilizados-nos-cursos-de-graduacao-da-ufabc
      // @ts-ignore for now
      g.ind_afinidade = 0.07 * g.cr + 0.63 * g.cp + 0.005 * g.quads;

      return g;
    });

    const studentGraduations = await Promise.all(studentGraduationsPromises);

    const student = await createOrInsert({
      ra,
      login,
      // @ts-ignore for now
      graduations: studentGraduations,
      studentId,
    });

    return student;
  });
};

export default plugin;
