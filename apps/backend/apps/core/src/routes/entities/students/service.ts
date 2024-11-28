import { ComponentModel } from "@/models/Component.js";
import { GraduationHistoryModel } from "@/models/GraduationHistory.js";
import { HistoryModel } from "@/models/History.js";
import { StudentModel } from "@/models/Student.js";
import { currentQuad } from "@next/common";

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


export async function getStudent(ra: number) {
  const season = currentQuad();
  const student = await StudentModel.findOne({
    ra,
    season,
  }, { aluno_id: 1, login: 1 }).lean<{ aluno_id: number; login: string }>()

  return student;
}


export async function getGraduation(ra: number, name: string) {
  const history = await HistoryModel.findOne({ ra, curso: name }).sort({ 
    updatedAt: -1
  })

  return history;
}

type CreateStudent = {
  ra: number;
  login: string;
  studentId: number;
  graduations:  {
    name: string;
    courseId: number[];
    cp: number | undefined;
    cr: number | undefined;
    ind_afinidade: number | undefined;
    quads: number | undefined;
  }[]
}

export async function createOrInsert({ studentId, ra, login, graduations }: CreateStudent) {
  const student = await StudentModel.findOneAndUpdate({
    aluno_id: studentId
  }, { ra, login, cursos: graduations }, { new: true, upsert: true })

  return student;
}