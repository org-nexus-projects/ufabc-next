import { ofetch } from 'ofetch';

export type UfabcParserComponent = {
  /** The id as we consume */
  UFComponentId: number;
  /** The code as we consume */
  UFComponentCode: string;
  campus: 'sbc' | 'sa';
  name: string;
  turma: string;
  turno: 'diurno' | 'noturno';
  credits: number;
  courses: Array<{
    name: string | '-';
    UFCourseId: number;
    category: 'limitada' | 'obrigatoria' | 'livre';
  }>;
  vacancies: number;
  hours: Record<string, { periodicity: string; classPeriod: string[] }>[];
};

export const ufabcParserService = ofetch.create({
  baseURL: process.env.UF_PROCESSOR_URL,
  timeout: 45 * 1000, // 45 seconds,
});

export async function getComponents() {
  const components =
    await ufabcParserService<UfabcParserComponent[]>('/components');
  return components;
}
