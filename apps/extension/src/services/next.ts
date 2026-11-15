import { NextApiConnector } from '@next/connectors/next-api';
import { logger } from '@/utils/logger';

export type {
  Component,
  MatriculaStudent,
  UpdatedStudent,
} from '@next/connectors/schemas/next-api';
export type { Student } from './ufabc-parser';

export type SigHistory = {
  ra: string;
  grade: string;
  course: string;
  components: Array<{
    grade: 'A' | 'B' | 'C' | 'D' | 'O' | 'F' | 'E' | null;
    name: string;
    status: string | null;
    year: string;
    period: '1' | '2' | '3';
    UFCode: string;
    category: 'mandatory' | 'free' | 'limited';
    credits: number;
  }>;
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

export type SubjectDetailedReview = {
  _id: {
    _id: string;
    mainTeacher: string;
  };
  distribution: Distribution[];
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

export type TeacherDetailedReview = {
  _id: {
    _id: string;
    name: string;
    search: string;
    updatedAt: string;
    createdAt: string;
    __v: number;
    creditos: number;
  };
  distribution: Distribution[];
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  cr_professor: number;
  cr_medio: number;
  weight: number;
};

export type SubjectReview = {
  subject: {
    name: string;
  };
  general: {
    amount: number;
    count: number;
    cr_medio: number;
    cr_professor: number;
    distribution: Distribution[];
    eadCount: number;
    numeric: number;
    numericWeight: number;
  };
  specific: SubjectDetailedReview[];
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
    distribution: Distribution[];
  };
  specific: TeacherDetailedReview[];
};

const nextApiConnector = new NextApiConnector({ baseURL: __NEXT_API_BASE_URL__ });

type SyncHistory = {
  sessionId: string;
  viewState: string;
  login: string;
  ra: string;
};

export async function syncHistoryV2(data: SyncHistory) {
  await nextApiConnector.syncSigaaStudent(
    {
      login: data.login,
      // oxlint-disable-next-line unicorn/prefer-number-coercion -- the scraped RA may carry trailing text
      ra: Number.parseInt(data.ra, 10),
    },
    data.sessionId,
    data.viewState,
  );
}

export async function sendResults(results: {
  sessionToken: string | null;
  sessKey: string | null;
}) {
  const { sessionToken, sessKey } = results;
  if (
    sessionToken === null ||
    sessionToken === '' ||
    sessKey === null ||
    sessKey === ''
  ) {
    logger.warn(
      results,
      '[sendResults] Token de sessão ou sessKey inválido(s), abortando envio.',
    );
    return;
  }

  try {
    return await nextApiConnector.sendResults(sessionToken, sessKey);
  } catch (error) {
    logger.error({ error }, '[sendResults] Erro ao enviar dados');
  }
}

export async function getSubjectReviews(subjectId: string) {
  const reviews = await nextApiConnector.getSubjectReviews(subjectId);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the connector schema differs from the extension view model
  return reviews as unknown as SubjectReview;
}

export async function getTeacherReviews(teacherId: string) {
  const reviews = await nextApiConnector.getTeacherReviews(teacherId);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the connector schema differs from the extension view model
  return reviews as unknown as TeacherReview;
}

export async function getComponents() {
  return await nextApiConnector.getEntityComponents();
}

export async function getKicksInfo(kickId: string, studentId?: number) {
  const kicks = await nextApiConnector.getComponentKicks(kickId, {
    studentId,
  });
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the connector returns an untyped payload
  return kicks as KicksInfo[];
}

export type KicksInfo = {
  studentId: number;
  cr: number | '-';
  cp: number;
  ik: string;
  reserva: boolean;
  curso: string;
  turno: 'Matutino' | 'Noturno';
};

export async function getStudent(login: string, sessionId: string) {
  return await nextApiConnector.getStudent(login, sessionId);
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
    graduationId: graduationId ?? undefined,
    login,
    studentId: studentId ?? undefined,
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
  return await nextApiConnector.updateStudent(
    {
      graduationId: graduationId ?? undefined,
      login,
      ra,
      studentId: studentId ?? undefined,
    },
    sessionId,
  );
}
