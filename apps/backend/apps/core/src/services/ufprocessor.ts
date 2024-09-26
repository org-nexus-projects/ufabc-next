import { Config } from '@/config/config.js';
import { logger } from '@next/common';
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

export type UFProcessorComponentFile = {
  /** The id as we consume */
  UFComponentId: '-' | number;
  /** The code as we consume */
  UFComponentCode: string;
  campus: 'sbc' | 'sa';
  name: string;
  turma: string;
  turno: 'diurno' | 'noturno';
  credits: number;
  tpi: [number, number, number];
  enrolled: number[];
  vacancies: number;
  /** The courses that are available for this component */
  courses: Array<{
    name: string | '-';
  }>;
  teachers: {
    practice: string | null;
    secondaryPractice: string | null;
    professor: string | null;
    secondaryProfessor: string | null;
  };
  hours: Record<string, { periodicity: string; classPeriod: string[] }>[];
};

type ComponentId = number;
type StudentIds = number;
export type UFProcessorEnrolled = Record<ComponentId, StudentIds[]>;

type StudentRA = string;
export type StudentComponent = {
  code: string;
  name: string | null;
  errors: string[] | [];
};
export type UFProcessorEnrollment = Record<StudentRA, StudentComponent[]>;

export type GraduationComponents = {
  name: string;
  UFComponentCode: string;
  category: 'limited' | 'mandatory';
  credits: number;
};

export type Graduation = {
  name: string;
  alias: string;
  campus: 'sa' | 'sbc';
  kind: 'licenciatura' | 'graduacao';
  shift: 'noturno' | 'matutino';
  grade: string;
  components: Array<GraduationComponents>;
};

export type UFCourse = {
  name: string;
  campus: string;
  coordinator: string;
  UFcourseId: number;
};

type UFGrade = {
  name: string;
  alias: string;
  year: string;
  appliedAt: string;
  status: string;
  period: string;
};

class UFProcessor {
  private readonly baseURL = Config.UF_PROCESSOR_URL;
  private readonly request: typeof ofetch;

  constructor() {
    this.request = ofetch.create({
      baseURL: this.baseURL,
      async onRequestError({ error }) {
        logger.warn(
          {
            error: error.name,
            info: error.cause,
          },
          '[PROCESSORS] Request error',
        );
        error.message = `[PROCESSORS] Request error: ${error.message}`;
        throw error;
      },
      async onResponseError({ error }) {
        if (!error) {
          return;
        }

        logger.warn(
          {
            error: error.name,
            info: error.cause,
          },
          '[PROCESSORS] Response error',
        );
        error.message = `[PROCESSORS] Response error: ${error.message}`;
        throw error;
      },
    });
  }
  async getComponents() {
    const components =
      await this.request<UFProcessorComponent[]>('/components');
    return components;
  }

  async getCourses() {
    const courses = await this.request<UFCourse[]>('/courses');
    return courses;
  }

  async getCourseGrades(UFCourseId: number) {
    const grades = await this.request<UFGrade[]>(
      `/courses/grades/${UFCourseId}`,
    );
    return grades;
  }

  async getComponentsFile(link: string) {
    const componentsWithTeachers = await this.request<
      UFProcessorComponentFile[]
    >('/componentsFile', {
      query: {
        link,
      },
    });
    return componentsWithTeachers;
  }

  async getEnrolledStudents() {
    const enrolled = await this.request<UFProcessorEnrolled>('/enrolled');
    return enrolled;
  }

  async getEnrollments(link: string) {
    const enrollments = await this.request<UFProcessorEnrollment>(
      '/enrollments',
      {
        query: {
          link,
        },
      },
    );
    return enrollments;
  }

  async getGraduationComponents(id: number, year: string) {
    const graduation = await this.request<Graduation>(
      `/courses/components/${id}/${year}`,
    );
    return graduation;
  }
}

export const ufProcessor = new UFProcessor();
