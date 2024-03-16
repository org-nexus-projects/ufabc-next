import type { Student } from '@/models/Student.js';
import type { StudentRepository } from './students.repository.js';
import type { currentQuad } from '@next/common';

export class StudentService {
  constructor(private readonly studentRepository: StudentRepository) {}

  async pastQuadStudents(season: ReturnType<typeof currentQuad>) {
    const quadDisciplinas = this.studentRepository.findDisciplinas({
      season,
    });
    const isPrevious = await quadDisciplinas.countDocuments({
      before_kick: { $exists: true, $ne: [] },
    });
    return isPrevious;
  }

  async findOneStudent(
    studentId: number,
    season: ReturnType<typeof currentQuad>,
  ) {
    const student = await this.studentRepository.findOneStudent({
      aluno_id: studentId,
      season,
    });

    return student;
  }

  async studentGraduationHistory(ra: number, curso: string) {
    const studentGraduation =
      await this.studentRepository.findOneStudentGraduation({
        ra,
        curso,
      });
    return studentGraduation;
  }

  async findAndUpdateStudent(
    studentId: number,
    season: ReturnType<typeof currentQuad>,
    toUpdate: Student,
  ) {
    const updatedStudent = await this.studentRepository.findAndUpdateStudent(
      {
        aluno_id: studentId,
        season,
      },
      {
        ra: toUpdate.ra,
        login: toUpdate.login,
        cursos: toUpdate.cursos,
      },
    );

    return updatedStudent;
  }
}
