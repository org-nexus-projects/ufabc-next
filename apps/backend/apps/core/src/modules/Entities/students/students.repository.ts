import type {
  Student,
  StudentDocument,
  StudentModel,
} from '@/models/Student.js';
import type {
  GraduationHistory,
  GraduationHistoryModel,
} from '@/models/GraduationHistory.js';
import type {
  Component,
  ComponentDocument,
  ComponentModel,
} from '@/models/Component.js';
import type { FilterQuery } from 'mongoose';
import { currentQuad } from '@next/common';

interface EntititesStudentRepository {
  findDisciplinas(
    filter: FilterQuery<Component>,
  ): Promise<ComponentDocument[] | null>;
  findStudents(filter: FilterQuery<Student>): Promise<StudentDocument[] | null>;
  findOneStudent(filter: FilterQuery<Student>): Promise<Student | null>;
  findOneStudentGraduation(
    filter: FilterQuery<GraduationHistory>,
  ): Promise<GraduationHistory | null>;
  findAndUpdateStudent(
    filter: FilterQuery<Student>,
    data: Student,
  ): Promise<StudentDocument | null>;
}

type StudentAggregate = Student & {
  cursos: Student['cursos'][number];
};

type CourseInfo = {
  _id: string;
  ids: Array<number>;
};

export class StudentRepository implements EntititesStudentRepository {
  constructor(
    private readonly studentService: typeof StudentModel,
    private readonly graduationHistoryService: typeof GraduationHistoryModel,
    private readonly disciplinaService: typeof ComponentModel,
  ) {}

  findDisciplinas(filter: FilterQuery<Component>) {
    const disciplinas = this.disciplinaService.find(filter);
    return disciplinas;
  }

  async findStudents(filter: FilterQuery<Component>) {
    const students = await this.studentService.find(filter);
    return students;
  }

  async findOneStudent(filter: FilterQuery<Student>) {
    const student = await this.studentService.findOne(filter);
    return student;
  }

  async findOneStudentGraduation(filter: FilterQuery<GraduationHistory>) {
    const studentGraduation = await this.graduationHistoryService
      .findOne(filter)
      .sort({ updatedAt: -1 });

    return studentGraduation;
  }

  async findAndUpdateStudent(
    filter: FilterQuery<Student>,
    data: Partial<Student>,
  ) {
    const updatedStudent = await this.studentService.findOneAndUpdate(
      filter,
      data,
      { upsert: true, returnOriginal: false },
    );

    return updatedStudent;
  }

  async kickedStudents(studentIds: number[]) {
    const tenant = currentQuad();
    const students = await this.studentService.aggregate<StudentAggregate>([
      {
        $match: { season: tenant, aluno_id: { $in: studentIds } },
      },
      { $unwind: '$cursos' },
    ]);
    return students;
  }

  async studentCourses() {
    const tenant = currentQuad();
    const courses = await this.studentService.aggregate<CourseInfo>([
      {
        $unwind: '$cursos',
      },
      {
        $match: {
          'cursos.id_curso': {
            $ne: null,
          },
          season: tenant,
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
  }
}
