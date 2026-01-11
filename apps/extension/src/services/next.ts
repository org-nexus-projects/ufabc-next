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
    _id: string;
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
  weight: number;
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
  login: string;
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

export const nextService = ofetch.create({
  baseURL: "https://api.v2.ufabcnext.com",
});


type SyncHistory = {
  sessionId: string;
  viewState: string;
  login: string;
  ra: string;
}

export async function syncHistory(data: SyncHistory) {
  const headers = new Headers();

  headers.set('session-id', data.sessionId)
  headers.set('view-state', data.viewState)

  const syncedStudent = await nextService<{ msg: string }>("/histories", {
    method: "POST",
    headers,
    body: {
      login: data.login,
      ra: data.ra,
    }
  });
  return syncedStudent;
}

export async function syncHistoryV2(data: SyncHistory) {
  const headers = new Headers()
  
  headers.set('session-id', data.sessionId)
  headers.set('view-id', data.viewState)

  
  await nextService('/v2/students/sigaa', {
    method: 'POST',
    headers,
    body: {
      login: data.login,
      ra: Number.parseInt(data.ra),
    }
  });
}

export async function sendResults(results: { sessionToken: string | null, sessKey: string | null }) {
  if (!results.sessionToken || !results.sessKey) {
    console.warn('[sendResults] Token de sessão ou sessKey inválido(s), abortando envio.');
    return;
  }

  const headers = new Headers();
  headers.set('session-id', results.sessionToken);
  headers.set('sess-key', results.sessKey);

  try {
    const response = await nextService<{ msg: string }>("/v2/components/archives", {
      method: 'POST',
      headers
    });
    return response;
  } catch (error) {
    console.error('[sendResults] Erro ao enviar dados:', error);
  }
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


export async function getStudent(login: string, ra: string) {
  const headers = new Headers();

  headers.set('uf-login', login)
  headers.set('ra', ra)

  const student = await nextService<MatriculaStudent>('/entities/students', {
    headers
  })

  return student;
}

type Components = {
  periodo: '1' | '2' | '3'
  codigo: string;
  disciplina: string;
  ano: number;
  situacao: string;
  creditos: number;
  categoria: "Livre Escolha" | "Obrigatória" | "Opção Limitada" | "-"
  conceitos: "A" | "B" | "C" | "D" | "O" | "F" | "-"
  turma: string;
  teachers: string[]
  identifier: string;
}

export type UpdatedStudent = {
  studentId: number;
  ra: number;
  graduations: Array<{
    components: Array<Components>

  }>
}

export async function updateStudent({
  login,
  ra,
  studentId,
  graduationId,
  sessionId
}: {
  login: string,
  ra: string,
  studentId: number | null,
  graduationId: number | null,
  sessionId: string
}
) {
  const headers = new Headers();

  headers.set('session-id', sessionId)

  const updatedStudent = await nextService<UpdatedStudent>('/entities/students', {
    method: 'PUT',
    body: {
      login,
      ra,
      studentId,
      graduationId
    },
    headers
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
