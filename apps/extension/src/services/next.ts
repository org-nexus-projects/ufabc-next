import { NextApiConnector } from '@next/connectors/next-api';
import type { SigStudent } from '@next/connectors/schemas/next-api';

import { logger } from '@/utils/logger';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'O' | 'F';

const nextApiConnector = new NextApiConnector({
  baseURL: import.meta.env.VITE_UFABC_NEXT_URL,
});

type SyncHistory = {
  sessionId: string;
  viewState: string;
  login: string;
  ra: string;
};

export async function syncHistory(data: SyncHistory) {
  return await nextApiConnector.syncHistory(data.sessionId, data.viewState, {
    login: data.login,
    ra: data.ra,
  });
}

export async function syncHistoryV2(data: SyncHistory) {
  await nextApiConnector.syncSigaaStudent(
    {
      login: data.login,
      ra: Number.parseInt(data.ra, 10),
    },
    data.sessionId,
    data.viewState
  );
}

export async function sendResults(results: {
  sessionToken: string | null;
  sessKey: string | null;
}) {
  if (results.sessionToken !== null && results.sessKey !== null) {
    await nextApiConnector.sendResults(results.sessionToken, results.sessKey);
    return;
  }

  logger.error(
    results,
    'Session token or session key is null. Cannot send results.'
  );
}

export async function getSubjectReviews(subjectId: string) {
  return await nextApiConnector.getSubjectReviews(subjectId);
}

export async function getTeacherReviews(teacherId: string) {
  return await nextApiConnector.getTeacherReviews(teacherId);
}

export async function getComponents() {
  return await nextApiConnector.getEntityComponents();
}

export async function getKicksInfo(kickId: string, studentId?: number) {
  return await nextApiConnector.getComponentKicks(kickId, { studentId });
}

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
  { studentId, login, graduationId }: SyncMatriculaStudentParams
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
    sessionId
  );
}

export async function getSigStudent(sigStudent: SigStudent, sessionId: string) {
  return await nextApiConnector.getSigStudent(sigStudent, sessionId);
}
