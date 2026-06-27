import { z } from 'zod';

export const ufabcParserTpiSchema = z.object({
  theory: z.number(),
  practice: z.number(),
  individual: z.number(),
});

export const ufabcParserTimetableSchema = z.object({
  dayOfTheWeek: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  periodicity: z.string(),
  classroomCode: z.string().nullable(),
  scheduleType: z.string().nullable(),
  frequency: z.string().nullable(),
  unparsed: z.string().nullable(),
});

export const ufabcParserCourseSchema = z.object({
  UFCourseId: z.number(),
  category: z.enum(['limited', 'mandatory']),
});

export const ufabcParserTeacherSchema = z.object({
  name: z.string(),
  role: z.enum(['professor', 'practice']),
  isSecondary: z.boolean(),
});

export const ufabcParserComponentSchema = z.object({
  componentKey: z.string(),
  subjectKey: z.string(),
  name: z.string(),
  credits: z.number(),
  ufComponentId: z.number(),
  alternateUfabcComponentId: z.number().nullable(),
  ufComponentCode: z.string(),
  campus: z.enum(['sbc', 'sa']),
  shift: z.enum(['morning', 'night']),
  vacancies: z.number(),
  componentClass: z.string(),
  season: z.string(),
  ufClassroomCode: z.string(),
  tpi: ufabcParserTpiSchema,
  timetable: z.array(ufabcParserTimetableSchema),
  courses: z.array(ufabcParserCourseSchema).nullable(),
  teachers: z.array(ufabcParserTeacherSchema),
});
export type UfabcParserComponent = z.infer<typeof ufabcParserComponentSchema>;

export const ufabcParserStudentSchema = z.object({
  studentKey: z.string(),
  login: z.string(),
  email: z.array(z.string()),
  metadata: z.record(z.unknown()),
  ra: z.string(),
});
export type UfabcParserStudent = z.infer<typeof ufabcParserStudentSchema>;

export const ufabcParserTeacherResponseSchema = z.object({
  teacherKey: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  email: z.array(z.string()),
  room: z.string().nullable(),
  metadata: z.record(z.unknown()),
});
export type UfabcParserTeacherResponse = z.infer<typeof ufabcParserTeacherResponseSchema>;

export const ufabcParserEnrolledSchema = z.record(z.array(z.number()));
export type UfabcParserEnrolled = z.infer<typeof ufabcParserEnrolledSchema>;

export const ufabcParserEnrollmentStudentComponentSchema = z.object({
  code: z.string(),
  name: z.string().nullable(),
  shift: z.enum(['morning', 'night']),
  class: z.string(),
  campus: z.enum(['sa', 'sbc']),
  original: z.string(),
  errors: z.array(z.string()),
});
export type UfabcParserEnrollmentStudentComponent = z.infer<typeof ufabcParserEnrollmentStudentComponentSchema>;

export const ufabcParserEnrollmentSchema = z.record(z.array(ufabcParserEnrollmentStudentComponentSchema));
export type UfabcParserEnrollment = z.infer<typeof ufabcParserEnrollmentSchema>;

export const ufabcParserSyncStudentResponseSchema = z.object({
  message: z.string(),
});
export type UfabcParserSyncStudentResponse = z.infer<typeof ufabcParserSyncStudentResponseSchema>;
