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
  Disciplina,
  DisciplinaDocument,
  DisciplinaModel,
} from '@/models/Disciplina.js';
import type { FilterQuery } from 'mongoose';

interface EntititesStudentRepository {
  findDisciplinas(
    filter: FilterQuery<Disciplina>,
  ): Promise<DisciplinaDocument[] | null>;
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

export class StudentRepository implements EntititesStudentRepository {
  constructor(
    private readonly studentService: typeof StudentModel,
    private readonly graduationHistoryService: typeof GraduationHistoryModel,
    private readonly disciplinaService: typeof DisciplinaModel,
  ) {}

  findDisciplinas(filter: FilterQuery<Disciplina>) {
    const disciplinas = this.disciplinaService.find(filter);
    return disciplinas;
  }

  async findStudents(filter: FilterQuery<Disciplina>) {
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
}
