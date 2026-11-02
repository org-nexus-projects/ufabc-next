import { currentQuad } from '@next/utils';

import type { UpdatedStudent } from '@/schemas/entities/students.js';

import { HistoryModel } from '@/models/History.js';
import { StudentModel, type Student } from '@/models/Student.js';
import { logger } from '@/utils/logger.js';
import { findRaByLogin } from '@/utils/resolve-student-ra.js';

export async function getGraduation(ra: number, name: string) {
  const history = await HistoryModel.findOne({
    ra,
    curso: name,
    active: { $ne: false },
  }).sort({
    updatedAt: -1,
  });

  return history;
}

type CreateStudent = {
  ra: number;
  login: string;
  studentId?: number;
  graduations: {
    nome_curso: string;
    id_curso: number;
    turno: 'Noturno' | 'Matutino' | 'noturno' | 'matutino';
    cp: number | undefined;
    cr: number | undefined;
    ind_afinidade: number | undefined;
    quads: number | undefined;
  }[];
};

type UpdateStudent = {
  ra: number | null;
  login: string;
  studentId: number | null | undefined;
  graduationId: number | null | undefined;
};

export async function createOrInsert({
  studentId,
  ra,
  login,
  graduations,
}: CreateStudent) {
  const season = currentQuad();

  const student = await StudentModel.findOneAndUpdate(
    {
      ra,
      season,
    },
    { $set: { ra, login, cursos: graduations, active: true } },
    { new: true, upsert: true }
  );

  return student;
}

export async function update({
  ra,
  login,
  studentId,
  graduationId,
}: UpdateStudent): Promise<UpdatedStudent | null> {
  const season = currentQuad();
  logger.info({ ra, login, studentId, graduationId });

  const resolvedRa = await findRaByLogin(login);

  if (!resolvedRa) {
    return null;
  }

  const student = await StudentModel.findOne({
    ra: resolvedRa,
    season,
    active: { $ne: false },
  });

  if (!student) {
    return null;
  }

  const historyComponents = await HistoryModel.findOne(
    { ra: student.ra, active: { $ne: false } },
    { disciplinas: 1, _id: 0 }
  )
    .sort({
      updatedAt: -1,
    })
    .lean();

  if (!historyComponents) {
    return null;
  }

  if (student.aluno_id) {
    const studentObj = student.toJSON<Student>();
    return {
      ra: studentObj.ra,
      studentId: studentObj.aluno_id,
      graduations: studentObj.cursos.map((c) => ({
        ...c,
        components: historyComponents.disciplinas,
      })),
    } as unknown as UpdatedStudent;
  }

  student.aluno_id = studentId;

  // THIS IS WRONG
  for (const curso of student.cursos) {
    curso.id_curso = graduationId;
  }

  await student.save();

  const studentObj = student.toJSON();

  return {
    ra: studentObj.ra,
    studentId: studentObj.aluno_id,
    graduations: studentObj.cursos.map((c) => ({
      ...c,
      components: historyComponents.disciplinas,
    })),
  } as unknown as UpdatedStudent;
}
