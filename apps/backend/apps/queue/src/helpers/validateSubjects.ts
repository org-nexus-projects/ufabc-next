import { camelCase, startCase } from 'lodash-es';
import type { Enrollment, SubjectDocument } from '@/types/models.js';

export function validateSubjects(
  payload: Enrollment,
  subjects: SubjectDocument[],
  extraMappings: Record<string, string> = {},
) {
  const mapping: Record<string, string> = { ...extraMappings };
  const enrollments: Enrollment[] = Array.isArray(payload)
    ? payload
    : [payload];
  const modifiedEnrollments = enrollments.filter(Boolean);

  const resultEnrollments = modifiedEnrollments.map((modifiedEnrollment) =>
    modifyPayload(modifiedEnrollment, subjects, mapping),
  );

  return resultEnrollments
    .filter(
      (resultPayload) =>
        resultPayload.disciplina !== '' && resultPayload.disciplina !== null,
    )
    .map((resultPayload) => resultPayload.disciplina!);
}

export function modifyPayload(
  payload: Enrollment,
  subjects: SubjectDocument[],
  mapping: Record<string, string>,
) {
  const { disciplina } = payload;
  const searchDisciplina = (disciplina: Enrollment['disciplina']) =>
    startCase(camelCase(disciplina));

  const converted = searchDisciplina(disciplina);
  const convertedMapping = searchDisciplina(mapping[disciplina ?? '']);

  const mapSubjects = subjects.map((subject) => subject.search);
  const subject = subjects.find((s) => s.search === converted);
  const subjectMapping = subjects.find((s) => s.search === convertedMapping);

  const modifiedPayload = { ...payload };

  if (
    !mapSubjects.includes(converted) &&
    !mapSubjects.includes(convertedMapping)
  ) {
    modifiedPayload.disciplina = convertedMapping || disciplina;
  }

  if (!subject && !subjectMapping) {
    return {
      ...modifiedPayload,
      subject: null,
      disciplina: payload.disciplina,
    };
  }

  return {
    ...modifiedPayload,
    subject: getSubjectId(subject, subjectMapping),
    disciplina: subjectMapping
      ? mapping[payload.disciplina!]
      : payload.disciplina,
  };
}

function getSubjectId(
  subject?: SubjectDocument,
  subjectMapping?: SubjectDocument,
) {
  if (subject && subjectMapping) {
    const subjectId = '_id' in subject ? subject._id : null;
    const subjectMappingId =
      '_id' in subjectMapping ? subjectMapping._id : null;

    return subjectId ?? subjectMappingId;
  }

  return null;
}
