import { UfabcParserConnector } from '@next/connectors/ufabc-parser';
import type { UfabcParserComponent } from '@next/connectors/schemas/ufabc-parser';

export type { UfabcParserComponent } from '@next/connectors/schemas/ufabc-parser';

export type ShallowStudent = {
  name: string;
  ra: string;
  login: string;
  email: string | undefined;
  graduations: Array<{
    course: string;
    campus: string;
    shift: string;
  }>;
  startedAt: string;
};

export type Student = ShallowStudent & {
  sessionId: string;
};

const ufabcParserBaseURL = import.meta.env.VITE_UFABC_PARSER_URL;

const ufabcParserConnector = new UfabcParserConnector({
  baseURL: ufabcParserBaseURL,
  requesterKey: 'ufabc-next',
});

export async function getUFEnrolled() {
  const enrolled = await ufabcParserConnector.getEnrolled();

  const result: Record<number, string[]> = {};
  for (const componentId in enrolled) {
    const studentIds = enrolled[Number(componentId)];

    for (const studentId of studentIds) {
      if (!result[studentId]) {
        result[studentId] = [];
      }
      result[studentId].push(componentId);
    }
  }

  return result;
}

export async function getUFComponents() {
  return ufabcParserConnector.getComponents();
}