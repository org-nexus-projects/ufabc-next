import { StudentModel, type Student } from '@/models/Student.js';
import { currentQuad } from '@next/common';

type StudentAggregate = Student & {
  cursos: Student['cursos'][number];
};

type CourseInfo = {
  _id: string;
  ids: Array<number>;
};

export const getKickedStudents = async (studentsIds: number[]) => {
  const tenant = currentQuad();
  const students = await StudentModel.aggregate<StudentAggregate>([
    {
      $match: { season: tenant, aluno_id: { $in: studentsIds } },
    },
    { $unwind: '$cursos' },
  ]);
  return students;
};

export const getCourses = async () => {
  const tenant = currentQuad();
  const courses = await StudentModel.aggregate<CourseInfo>([
    {
      $unwind: '$cursos',
    },
    {
      $match: {
        'cursos.id_curso': {
          $ne: null,
        },
        season: '2024:2',
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

  return courses;
};
