import { camelCase, startCase } from 'lodash-es';
import { SequenceMatcher, getCloseMatches } from 'difflib';

type Teacher = {
  name: string;
  alias?: string[];
};

const getTypeOrDefault = (
  type: string | null,
  mappings: Record<string, string>,
) => {
  if (type! in mappings) {
    return mappings[type!]!;
  }

  return startCase(camelCase(type!));
};

const isValidTeacherType = (type: string) => {
  return type !== 'N D' && type !== 'Falso';
};

const handleBestMatch = (type: string, teachers: Teacher[]) => {
  const bestMatch = getCloseMatches(
    type,
    teachers.map((teacher) => teacher.name),
  )[0];

  const s = new SequenceMatcher(null, bestMatch, type);
  if (s.ratio() > 0.8) {
    return teachers.find((teacher) => teacher.name === bestMatch)!;
  } else {
    return { error: `Missing Teacher: ${type}` };
  }
};

export function resolveProfessor(
  teacherType: string | null,
  teachers: Teacher[],
  mappings: Record<string, string> = {},
) {
  const findTeacher = (type: string) => {
    return (
      teachers.find((teacher) => type === teacher.name) ||
      teachers.find((teacher) => (teacher.alias || []).includes(type))!
    );
  };

  teacherType = getTypeOrDefault(teacherType, mappings);
  if (!teacherType) {
    return null;
  }

  if (!isValidTeacherType(teacherType)) {
    return null;
  }

  const foundTeacher = findTeacher(teacherType);
  if (foundTeacher) {
    return foundTeacher;
  }

  return handleBestMatch(teacherType, teachers);
}
