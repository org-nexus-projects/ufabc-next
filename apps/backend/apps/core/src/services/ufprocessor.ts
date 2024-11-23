import { Config } from '@/config/config.js';
import { ofetch } from 'ofetch';

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
  private readonly baseURL = Config.UFABC_PARSER_URL;
  private readonly request: typeof ofetch;

  constructor() {
    this.request = ofetch.create({
      baseURL: this.baseURL,
    });
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

  async getGraduationComponents(id: number, year: string) {
    const graduation = await this.request<Graduation>(
      `/courses/components/${id}/${year}`,
    );
    return graduation;
  }
}

export const ufProcessor = new UFProcessor();
