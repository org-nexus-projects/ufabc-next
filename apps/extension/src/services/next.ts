import type { Student } from "@/scripts/sig/homepage";
import { ofetch } from "ofetch";

export type StudentHistory = {
	grade: string;
	ra: number;
	curso: string;
}

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

type Concept = "A" | "B" | "C" | "D" | "O" | "F"

type Distribution = {
  conceito: Concept;
  weight: number;
  count: number;
  cr_medio: number;
  numeric: number;
  numericWeight: number;
  amount: number;
  cr_professor: number;
}

type DetailedReviews = {
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

type SubjectReview = {
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
  specific: Array<DetailedReviews>
}

type Component = {
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

function resolveEndpoint() {
  if (import.meta.env.PROD) {
    return "https://api.v2.ufabcnext.com";
  }

  return "http://localhost:5000";
}

export const nextService = ofetch.create({
  baseURL: resolveEndpoint(),
});

export async function getStudentHistory(ra: number) {
  const studentHistory = await nextService<StudentHistory>(`/histories/me?ra=${ra}`);

  return studentHistory;
}

export async function createStudent(student: Student) {
  const createdStudent = await nextService("/entities/student", {
    method: "POST",
    body: student,
  });
  return createdStudent;
}

export async function syncHistory(student: SigHistory) {
  const syncedStudent = await nextService("/histories", {
    method: "POST",
    body: student,
  });
  return syncedStudent;
}

export async function getSubjectReviews(subjectId: string) {
  const reviews = await nextService<SubjectReview>(`/entities/subjects/reviews/${subjectId}`)
  return reviews;
}


export async function getComponents() {
  const components = nextService<Component[]>('/entities/components')
  return components;
}
