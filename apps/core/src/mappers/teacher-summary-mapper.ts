import type { Types } from 'mongoose';

import type { Summary } from '@/models/Summary.js';

type LeanSummary = Summary & { teacher: Types.ObjectId };

export class TeacherSummaryMapper {
  toResponse(summary: LeanSummary) {
    return {
      commentsCount: summary.commentsCount,
      didacticQuality: summary.didacticQuality ?? null,
      summary: summary.summary,
      takesAttendance: summary.takesAttendance ?? null,
      teacher: summary.teacher.toString(),
      usesMoodle: summary.usesMoodle ?? null,
      usesSigaa: summary.usesSigaa ?? null,
    };
  }
}
