import { ComponentModel } from "@/models/Component.js";
import { StudentModel } from "@/models/Student.js";

export async function getComponentsStudentsStats(season: string, dataKey: '$before_kick' | '$alunos_matriculados') {
  const stats = await ComponentModel.aggregate<{ studentsNumber: number; componentsNumber: number }>([
    { $match: { season } },
    { $unwind: dataKey },
    { $group: { _id: dataKey, count: { $sum: 1 } } },
    { $group: { _id: '$count', studentsNumber: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        studentsNumber: 1,
        componentsNumber: '$_id',
      },
    }
  ])

  return stats;
}

export async function getAllCourses() {
  const courses = await StudentModel.aggregate([
    {
      $unwind: '$cursos',
    },
    {
      $match: {
        'cursos.id_curso': {
          $ne: null,
        },
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
    {
      $project: {
        _id: 0,
        names: '$_id',
        UFCourseIds: '$ids'
      }
    }
  ])

  return courses;
}