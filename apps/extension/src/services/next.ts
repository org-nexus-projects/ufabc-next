import { NextApiConnector } from '@next/connectors/next-api';
import type {
  Component,
  MatriculaStudent,
  SigStudent,
  UpdatedStudent,
} from '@next/connectors/schemas/next-api';
import type { Student } from './ufabc-parser';
import { logger } from '@/utils/logger';

export type { Component, MatriculaStudent, SigStudent, UpdatedStudent };
export type { Student } from './ufabc-parser';

export type SigHistory = {
  ra: string;
  grade: string;
  course: string;
  components: {
    grade: 'A' | 'B' | 'C' | 'D' | 'O' | 'F' | 'E' | null;
    name: string;
    status: string | null;
    year: string;
    period: '1' | '2' | '3';
    UFCode: string;
    category: 'mandatory' | 'free' | 'limited';
    credits: number;
  }[];
};

export type Grade = 'A' | 'B' | 'C' | 'D' | 'O' | 'F';

export type Distribution = {
  conceito: Grade;
  weight: number;
  count: number;
  cr_medio: number;
  numeric: number;
  numericWeight: number;
  amount: number;
  cr_professor: number;
};

type SubjectDetailedReview = {
  _id: {
    _id: string;
    mainTeacher: string;
  };
  distribution: Array<Distribution>;
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  cr_professor: number;
  cr_medio: number;
  teacher: {
    _id: string;
    name: string;
    alias: string[] | null;
  };
  weight: number;
};

type TeacherDetailedReview = {
  _id: {
    _id: string;
    name: string;
    search: string;
    updatedAt: string;
    createdAt: string;
    __v: number;
    creditos: number;
  };
  distribution: Array<Distribution>;
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  cr_professor: number;
  cr_medio: number;
  weight: number;
};

export type SubjectReview = {
  general: {
    amount: number;
    count: number;
    cr_medio: number;
    cr_professor: number;
    distribution: Array<Distribution>;
    eadCount: number;
    numeric: number;
    numericWeight: number;
  };
  specific: Array<SubjectDetailedReview>;
};

export type TeacherReview = {
  teacher: {
    _id: string;
    name: string;
    alias?: string[];
    updatedAt?: string;
  };
  general: {
    cr_medio: string | null;
    cr_professor: string | null;
    count: number;
    amount: number;
    numeric: number;
    numericWeight: number;
    weight: number;
    distribution: Array<Distribution>;
  };
  specific: Array<TeacherDetailedReview>;
};

const nextApiBaseURL =
  import.meta.env.WXT_UFABC_NEXT_URL ?? 'https://api.v2.ufabcnext.com';

const nextApiConnector = new NextApiConnector({ baseURL: nextApiBaseURL });

type SyncHistory = {
  sessionId: string;
  viewState: string;
  login: string;
  ra: string;
};

export async function syncHistory(data: SyncHistory) {
  return nextApiConnector.syncHistory(data.sessionId, data.viewState, {
    login: data.login,
    ra: data.ra,
  });
}

export async function syncHistoryV2(data: SyncHistory) {
  await nextApiConnector.syncSigaaStudent(
    {
      login: data.login,
      ra: Number.parseInt(data.ra),
    },
    data.sessionId,
    data.viewState,
  );
}

export async function sendResults(results: {
  sessionToken: string | null;
  sessKey: string | null;
}) {
  if (!results.sessionToken || !results.sessKey) {
    logger.warn(
      results,
      '[sendResults] Token de sessão ou sessKey inválido(s), abortando envio.',
    );
    return;
  }

  try {
    return await nextApiConnector.sendResults(
      results.sessionToken,
      results.sessKey,
    );
  } catch (error) {
    logger.error({ error }, '[sendResults] Erro ao enviar dados');
  }
}

export async function getSubjectReviews(subjectId: string) {
  return (await nextApiConnector.getSubjectReviews(
    subjectId,
  )) as unknown as SubjectReview;
}

export async function getTeacherReviews(teacherId: string) {
  return (await nextApiConnector.getTeacherReviews(
    teacherId,
  )) as unknown as TeacherReview;
}

export async function getComponents() {
  return nextApiConnector.getEntityComponents();
}

export async function getKicksInfo(kickId: string, studentId?: number) {
  return nextApiConnector.getComponentKicks(kickId, { studentId });
}

export async function getStudent(login: string, sessionId: string) {
  return nextApiConnector.getStudent(login, sessionId);
}

type SyncMatriculaStudentParams = {
  studentId: number | null;
  login: string | undefined;
  graduationId: number | null;
};

export async function syncMatriculaStudent(
  sessionId: string,
  { studentId, login, graduationId }: SyncMatriculaStudentParams,
) {
  await nextApiConnector.syncMatriculaStudent(sessionId, {
    studentId: studentId ?? undefined,
    graduationId: graduationId ?? undefined,
    login,
  });
}

export async function updateStudent({
  login,
  ra,
  studentId,
  graduationId,
  sessionId,
}: {
  login: string;
  ra: string;
  studentId: number | null;
  graduationId: number | null;
  sessionId: string;
}) {
  return nextApiConnector.updateStudent(
    {
      login,
      ra,
      studentId: studentId ?? undefined,
      graduationId: graduationId ?? undefined,
    },
    sessionId,
  );
}

export async function getSigStudent(sigStudent: SigStudent, sessionId: string) {
  return (await nextApiConnector.getSigStudent(
    sigStudent,
    sessionId,
  )) as unknown as Student;
}