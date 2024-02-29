import { courseId, currentQuad } from '@next/common';
import { sortBy as LodashSortBy } from 'lodash-es';
import { type Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
import { type Student, StudentModel } from '@/models/Student.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

type DisciplinaKicksRequest = {
  Params: {
    disciplinaId: number;
  };
  Querystring: {
    aluno_id: number;
    sort?: string;
  };
};

type StudentAggregate = Student & {
  cursos: Student['cursos'][number];
};

export async function getDisciplinasKicks(
  request: FastifyRequest<DisciplinaKicksRequest>,
  reply: FastifyReply,
) {
  const { disciplinaId } = request.params;
  const { sort } = request.query;

  if (!disciplinaId) {
    await reply.badRequest('Missing DisciplinaId');
  }

  const season = currentQuad();

  const disciplina = await DisciplinaModel.findOne({
    season,
    disciplina_id: disciplinaId,
  });

  if (!disciplina) {
    return reply.notFound('Disciplina not found');
  }

  // create sort mechanism
  const kicks = sort || kickRule(disciplina);
  // @ts-expect-error for now
  const order = [kicks.length || 0].fill('desc');

  // turno must have a special treatment
  const turnoIndex = kicks.indexOf('turno');
  if (turnoIndex !== -1) {
    // @ts-expect-error for now
    order[turnoIndex] = disciplina.turno === 'diurno' ? 'asc' : 'desc';
  }

  const isAfterKick = [disciplina.after_kick].filter(Boolean).length;
  const result = resolveMatricula(disciplina, isAfterKick);

  const resultMap = new Map(result.map((r) => [r.aluno_id, r]));
  const students = await StudentModel.aggregate<StudentAggregate>([
    {
      $match: { season, aluno_id: { $in: result.map((r) => r.aluno_id) } },
    },
    { $unwind: '$cursos' },
  ]);

  const interIds = [
    await courseId('Bacharelado em Ciência e Tecnologia', season, StudentModel),
    await courseId(
      'Bacharelado em Ciências e Humanidades',
      season,
      StudentModel,
    ),
  ];

  const obrigatorias = getObrigatoriasFromDisciplinas(
    disciplina.obrigatorias,
    ...interIds,
  );

  const studentsWithGraduationInfo = students.map((student) => {
    const reserva = obrigatorias.includes(student.cursos.id_curso);
    const graduationToStudent = Object.assign(
      {
        aluno_id: student.aluno_id,
        cr: '-',
        cp: student.cursos.cp,
        ik: reserva ? student.cursos.ind_afinidade : 0,
        reserva,
        turno: student.cursos.turno,
        curso: student.cursos.nome_curso,
      },
      resultMap.get(student.aluno_id) || {},
    );

    return graduationToStudent;
  });

  const sortedStudents = LodashSortBy(studentsWithGraduationInfo, kicks);

  const uniqueStudents = [];
  const uniqueStudentIds = new Set();

  for (const student of sortedStudents) {
    if (!uniqueStudentIds.has(student.aluno_id)) {
      uniqueStudents.push(student);
      uniqueStudentIds.add(student.aluno_id);
    }
  }

  return reply.send(uniqueStudents);
}

const kickRule = (disciplina: Disciplina) => {
  const season = currentQuad();
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
    coeffRule = disciplina.ideal_quad ? ['cr', 'cp'] : ['cp', 'cr'];
  }

  return ['reserva', 'turno', 'ik'].concat(coeffRule);
};

const resolveMatricula = (disciplina: Disciplina, isAfterKick: number) => {
  // if kick has not arrived, not one has been kicked
  if (!isAfterKick) {
    const registeredStudents = disciplina.alunos_matriculados || [];
    return registeredStudents.map((student) => ({
      aluno_id: student,
    }));
  }

  // check diff between before_kick and after_kick
  const kicked = differenceOnKicks(
    disciplina.before_kick ?? [],
    disciplina.after_kick ?? [],
  );
  // return who has been kicked
  return disciplina.before_kick.map((student) => ({
    aluno_id: student,
    kicked: kicked.includes(student),
  }));
};

const differenceOnKicks = (beforeKick: number[], afterKick: number[]) =>
  beforeKick.filter((kick) => !afterKick.includes(kick));

const getObrigatoriasFromDisciplinas = (
  obrigatorias: number[],
  ...filterList: Awaited<ReturnType<typeof courseId>>[]
) => {
  const removeSet = new Set(filterList);
  return obrigatorias.filter((obrigatoria) => !removeSet.has(obrigatoria));
};
