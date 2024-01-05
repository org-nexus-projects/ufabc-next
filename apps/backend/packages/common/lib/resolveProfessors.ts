/* eslint-disable eqeqeq */
import { camelCase, startCase } from 'lodash-es';
import { SequenceMatcher, getCloseMatches } from 'difflib';

type Teacher = {
  name: string;
  alias?: string[];
};

export function resolveProfessor(
  teacherType: string | null,
  teachers: Teacher[],
  mappings: Record<string, string> = {},
) {
  if (teacherType! in mappings) {
    return mappings[teacherType!]!;
  }

  teacherType = startCase(camelCase(teacherType!));

  const foundTeacher =
    teachers.find((teacher) => teacherType === teacher.name) ||
    teachers.find((teacher) => (teacher.alias || []).includes(teacherType!));
  if (!teacherType) {
    return null;
  } else if (teacherType == 'N D' || teacherType == 'Falso') {
    return null;
  } else if (foundTeacher) {
    return foundTeacher;
  } else {
    const bestMatch = getCloseMatches(
      teacherType,
      teachers.map((teacher) => teacher.name),
    )[0];

    const s = new SequenceMatcher(null, bestMatch, teacherType);
    if (s.ratio() > 0.8) {
      return teachers.find((teacher) => teacher.name === bestMatch);
    } else {
      return { error: `Missing Teacher: ${teacherType}` };
    }
  }
}
