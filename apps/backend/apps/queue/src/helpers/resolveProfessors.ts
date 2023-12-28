import { diffChars } from 'diff';
import { camelCase, startCase } from 'lodash-es';
import type { Teacher } from '@/types/models.js';

export function resolveProfessors(
  name: string,
  teachers: Teacher[],
  mappings: Record<string, string> = {},
) {
  if (name in mappings) {
    return mappings[name];
  }

  const normalizedName = startCase(camelCase(name));
  const isNameInvalid =
    !normalizedName || ['N D', 'Falso'].includes(normalizedName);

  if (isNameInvalid) {
    return null;
  }
  const isTeacherPresent = (t: Teacher) =>
    t.name === normalizedName ?? (t.alias || []).includes(normalizedName);
  const foundTeacher = teachers.find((teacher) => isTeacherPresent(teacher));

  if (foundTeacher) {
    return foundTeacher;
  }

  let bestMatch: string;
  let bestMatchScore = 0;

  for (const teacher of teachers) {
    const diff = diffChars(normalizedName, teacher.name);
    const score = diff.reduce(
      (acc, part) => (part.added ? acc : acc + part.count!),
      0,
    );

    if (score > bestMatchScore) {
      bestMatch = teacher.name;
      bestMatchScore = score;
    }
  }

  const similarityThreshold = 0.8;
  if (bestMatchScore > similarityThreshold) {
    return teachers.find((t) => t.name === bestMatch);
  }

  return { error: `Missing Teacher: ${normalizedName}` };
}
