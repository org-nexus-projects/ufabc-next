import { camelCase, startCase } from 'lodash-es';
import type { SubjectDocument } from '@/models/Subject.js';
import type { Disciplina } from '@/models/Disciplina.js';

const castToArr = (arr: any[]) => (Array.isArray(arr) ? arr : [arr]);
const convertedSubjectName = (
  disciplina: string,
  mapping?: Record<string, string>,
) => {
  const converted = startCase(camelCase(disciplina));
  return startCase(camelCase(mapping![disciplina])) || converted;
};

const findSubjectById = (subjects: SubjectDocument[], search: string) => {
  return subjects.find((subject) => subject.search === search);
};

export function validateSubjects<TPayload>(
  payload: TPayload[],
  subjects: SubjectDocument[],
  extraMappings = {},
) {
  const mapping: Record<string, string> = Object.assign({}, extraMappings);

  const mapSubjects = subjects.map((subject) => subject.search);
  const castPayloadToArray = castToArr(payload) as Disciplina[];
  const missingDisciplines: string[] = [];
  for (const ufabcDisciplina of castPayloadToArray) {
    const convertedSubject = convertedSubjectName(
      ufabcDisciplina.disciplina!,
      mapping,
    );
    if (!mapSubjects.includes(convertedSubject)) {
      missingDisciplines.push(ufabcDisciplina?.disciplina as never);
      continue;
    }

    const subject = findSubjectById(subjects, convertedSubject);

    ufabcDisciplina.disciplina =
      mapping[ufabcDisciplina.disciplina!] || ufabcDisciplina.disciplina;

    ufabcDisciplina.subject = subject?._id || undefined;
  }
  return missingDisciplines.filter(
    (disciplines) => disciplines !== '' && disciplines !== undefined,
  );
}
