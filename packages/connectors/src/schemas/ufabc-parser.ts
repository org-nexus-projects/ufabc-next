import { z } from 'zod';

export const ufabcParserTpiSchema = z.object({
  individual: z.number(),
  practice: z.number(),
  theory: z.number(),
});

export const ufabcParserTimetableSchema = z.object({
  classroomCode: z.string().nullable(),
  dayOfTheWeek: z.string(),
  endTime: z.string(),
  frequency: z.string().nullable(),
  periodicity: z.string(),
  scheduleType: z.string().nullable(),
  startTime: z.string(),
  unparsed: z.string().nullable(),
});

export const ufabcParserCourseSchema = z.object({
  UFCourseId: z.number(),
  category: z.enum(['limited', 'mandatory']),
});

export const ufabcParserTeacherSchema = z.object({
  isSecondary: z.boolean(),
  name: z.string(),
  role: z.enum(['professor', 'practice']),
});

export const ufabcParserComponentSchema = z.object({
  alternateUfabcComponentId: z.number().nullable(),
  campus: z.enum(['sbc', 'sa']),
  componentClass: z.string(),
  componentKey: z.string(),
  courses: z.array(ufabcParserCourseSchema).nullable(),
  credits: z.number(),
  name: z.string(),
  season: z.string(),
  shift: z.enum(['morning', 'night']),
  subjectKey: z.string(),
  teachers: z.array(ufabcParserTeacherSchema),
  timetable: z.array(ufabcParserTimetableSchema),
  tpi: ufabcParserTpiSchema,
  ufClassroomCode: z.string(),
  ufComponentCode: z.string(),
  ufComponentId: z.number(),
  vacancies: z.number(),
});
export type UfabcParserComponent = z.infer<typeof ufabcParserComponentSchema>;

export const ufabcParserStudentSchema = z.object({
  email: z.array(z.string()),
  login: z.string(),
  metadata: z.record(z.unknown()),
  ra: z.string(),
  studentKey: z.string(),
});
export type UfabcParserStudent = z.infer<typeof ufabcParserStudentSchema>;

export const ufabcParserTeacherResponseSchema = z.object({
  aliases: z.array(z.string()),
  email: z.array(z.string()),
  metadata: z.record(z.unknown()),
  name: z.string(),
  room: z.string().nullable(),
  teacherKey: z.string(),
});
export type UfabcParserTeacherResponse = z.infer<
  typeof ufabcParserTeacherResponseSchema
>;

export const ufabcParserEnrolledSchema = z.record(z.array(z.number()));
export type UfabcParserEnrolled = z.infer<typeof ufabcParserEnrolledSchema>;

export const ufabcParserEnrollmentStudentComponentSchema = z.object({
  campus: z.enum(['sa', 'sbc']),
  class: z.string(),
  code: z.string(),
  errors: z.array(z.string()),
  name: z.string().nullable(),
  original: z.string(),
  shift: z.enum(['morning', 'night']),
});
export type UfabcParserEnrollmentStudentComponent = z.infer<
  typeof ufabcParserEnrollmentStudentComponentSchema
>;

export const ufabcParserEnrollmentSchema = z.record(
  z.array(ufabcParserEnrollmentStudentComponentSchema)
);
export type UfabcParserEnrollment = z.infer<typeof ufabcParserEnrollmentSchema>;

export const ufabcParserSyncStudentResponseSchema = z.object({
  message: z.string(),
});
export type UfabcParserSyncStudentResponse = z.infer<
  typeof ufabcParserSyncStudentResponseSchema
>;
