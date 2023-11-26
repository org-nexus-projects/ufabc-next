import { ConceptData } from 'types';

export const transformConceptDataToObject = (grades: ConceptData[]) => {
  const result: Record<string, number> = {};
  grades.forEach((grade) => {
    result[grade.conceito] = grade.count;
  });
  const ordered = Object.keys(result)
    .sort()
    .reduce((obj: typeof result, key) => {
      obj[key] = result[key];
      return obj;
    }, {});
  return ordered;
};
