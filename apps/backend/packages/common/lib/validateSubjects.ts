import { camelCase, startCase } from 'lodash-es';
import type { ObjectId } from 'mongoose';

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

type Enrollment = {
  year: number;
  quad: number;
  comments?: string;
  type?: 'teoria' | 'pratica';
  ra: number;
  creditos?: number;
  turno?: string;
  disciplina?: string;
  season?: string;
  mainTeacher?: string;
  teoria?: string;
  pratica?: string;
  identifier?: string;
  campus?: string;
  turma?: string;
  conceito?: string;
  ca_acumulado?: number;
  cr_acumulado?: number;
  cp_acumulado?: number;
  subject?: string;
};

type SubjectDocument = {
  _id: ObjectId;
  name: string;
  search?: string;
  creditos?: number;
};

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
