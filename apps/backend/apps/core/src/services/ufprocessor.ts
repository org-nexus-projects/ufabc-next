import { Config } from '@/config/config.js';
import { ofetch } from 'ofetch';

export type UFProcessorComponent = {
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

class UFProcessor {
  private readonly baseURL = Config.UF_PROCESSOR_URL;
  private readonly request: typeof ofetch;

  constructor() {
    this.request = ofetch.create({
      baseURL: this.baseURL,
      async onRequestError({ error }) {
        console.error('[PROCESSORS] Request error', {
          error: error.name,
          info: error.cause,
        });
        error.message = `[PROCESSORS] Request error: ${error.message}`;
        throw error;
      },
      async onResponseError({ error }) {
        if (!error) {
          return;
        }

        console.error('[PROCESSORS] Request error', {
          error: error.name,
          info: error.cause,
        });
        error.message = `[PROCESSORS] Request error: ${error.message}`;
        throw error;
      },
    });
  }
  async getComponents() {
    const components =
      await this.request<UFProcessorComponent[]>('/components');
    return components;
  }
}

export const ufProcessor = new UFProcessor();
