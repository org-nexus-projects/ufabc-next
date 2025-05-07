import { ofetch } from "ofetch";
import type { Student } from "./ufabc-parser";

export type SigHistory = {
  ra: string;
  grade: string;
  course: string;
  components: {
    grade: "A" | "B" | "C" | "D" | "O" | "F" | "E" | null;
    name: string;
    status: string | null;
    year: string;
    period: "1" | "2" | "3";
    UFCode: string;
    category: "mandatory" | "free" | "limited";
    credits: number;
  }[];
};

export type Grade = "A" | "B" | "C" | "D" | "O" | "F";

export type Distribution = {
  conceito: Grade;
  weight: number;
  count: number;
  cr_medio: number;
  numeric: number;
  numericWeight: number;
  amount: number;
  cr_professor: number;
}

type SubjectDetailedReview = {
  _id: {
    mainTeacher: string;
  }
  distribution: Array<Distribution>
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  cr_professor: number;
  cr_medio: number;
  teacher: {
    _id: string;
    name: string;
    alias: string[] | null
  }
}

type TeacherDetailedReview = {
  _id: {
    _id: string;
    name: string;
    search: string;
    updatedAt: string;
    createdAt: string
    __v: number;
    creditos: number;
  }
  distribution: Array<Distribution>
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  cr_professor: number;
  cr_medio: number;
}

export type SubjectReview = {
  subject: {
    _id: string,
    name: string,
    search: string,
    updatedAt: string,
    creditos: number
  }
  general:  {
    distribution: Array<Distribution>
    cr_medio: number;
    cr_professor: number;
    count: number;
    amount: number;
    numeric: number;
    numericWeight: number;
    weight: number;
  }
  specific: Array<SubjectDetailedReview>
}

export type TeacherReview = {
  teacher: {
    _id: string;
    name: string;
    alias?: string[]
    updatedAt?: string
  }
  general: {
    cr_medio: string | null
    cr_professor: string | null
    count: number;
    amount: number;
    numeric: number
    numericWeight: number;
    weight: number;
    distribution: Array<Distribution>
  }
  specific: Array<TeacherDetailedReview>
}

export type Component = {
	identifier: string;
	disciplina_id: number;
	subject: string;
	subjectId: string;
	turma: string;
	turno: "diurno" | "noturno";
	vagas: number;
	requisicoes: number;
	campus: "sbc" | "sa";
	teoria?: string;
	teoriaId?: string;
	pratica?: string;
	praticaId?: string;
};

export type MatriculaStudent =  {
  studentId: number;
  graduations: {
      courseId: number;
      name: string;
      shift: "Noturno" | "Matutino";
      affinity: number;
      cp: number;
      cr: number;
      ca: number
  }[];
  updatedAt: string;
}

type CreateStudent = {
  ra: string;
  login: string;
  graduations: {
      name: string;
      courseId: number;
      cp?: number | undefined;
      cr?: number | undefined;
      quads?: number | undefined;
      turno: string;
  }[];
  studentId?: number | undefined;
}

export const nextService = ofetch.create({
  baseURL: import.meta.env.VITE_UFABC_NEXT_URL,
});

export async function createStudent(student: CreateStudent) {
  const createdStudent = await nextService("/entities/students", {
    method: "POST",
    body: student,
  });
  return createdStudent;
}

export async function syncHistory(sessionId: string, viewState: string) {
  const headers = new Headers();

  headers.set('session-id', sessionId)
  headers.set('view-state', viewState)

  const syncedStudent = await nextService<{ msg: string }>("/histories", {
    method: "POST",
    headers
  });
  return syncedStudent;
}

export async function getSubjectReviews(subjectId: string) {
  const reviews = await nextService<SubjectReview>(`/entities/subjects/reviews/${subjectId}`)
  return reviews;
}

export async function getTeacherReviews(teacherId: string) {
  const reviews = await nextService<TeacherReview>(`/entities/teachers/reviews/${teacherId}`)
  return reviews;
}

export async function getComponents() {
  const components = await nextService<Component[]>('/entities/components')
  return components;
}

export async function getKicksInfo(kickId: string, studentId?: number) {
  const kicksData = await nextService(`/entities/components/${kickId}/kicks?studentId=${studentId}`)
  return kicksData;
}


export async function getStudent(login: string) {
  const headers = new Headers();

  headers.set('uf_login', login)

  const student = await nextService<MatriculaStudent>('/entities/students/student', {
    headers
  })

  return student;
}

export async function updateStudent(login: string, ra: string, studentId: number | null) {
  const updatedStudent = await nextService<{ msg: string }>('/entities/students', {
    method: 'PUT',
    body: {
      login,
      ra,
      studentId
    }
  })
  return updatedStudent
}

type SigStudent = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: 'graduacao' | 'licenciatura';
	status: string;
	curso: string;
};

export async function getSigStudent(sigStudent: SigStudent, sessionId: string) {
  const headers = new Headers();

  headers.set('session-id', sessionId)

  const student = await nextService<Student>('/entities/students/sig', {
    method: 'POST',
    body: sigStudent,
    headers
  })

  return student;
}

type SigComponent = {
	UFCode: string;
	name: string;
	grade: 'A' | 'B' | 'C' | 'D' | 'O' | 'F' | 'E' | null;
	status: string;
	year: string;
	period: '1' | '2' | '3';
	credits: number;
};

type HydratedComponent = SigComponent & {
	category: 'free' | 'mandatory' | 'limited';
};

export type CompleteStudent = {
	name: string;
	ra: string;
	login: string;
  studentId?: number | undefined
	email: string | undefined;
	graduations: Array<{
		course: Course;
		campus: string;
		shift: string;
		grade: string;
    UFCourseId: number;
		components: HydratedComponent[];
	}>;
	startedAt: string;
	lastUpdate: number;
};

export async function getSigStudentGrades(sigStudent: Student, sessionId: string, viewState: string, action: string) {
  const headers = new Headers();

  headers.set('session-id', sessionId)
  headers.set('view-state', viewState)

  const student = await nextService<CompleteStudent>('/entities/students/sig/grades', {
    method: 'POST',
    body: {
      student: sigStudent,
      action,
    },
    headers
  })

  return student;
}
