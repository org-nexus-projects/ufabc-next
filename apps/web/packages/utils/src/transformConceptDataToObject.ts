import { ConceptData } from 'types';

export const transformConceptDataToObject = (
  grades: ConceptData[],
  eadFilter?: boolean,
) => {
  const result: Record<string, number> = {};
  grades.forEach((grade) => {
    if (eadFilter) {
      result[grade.conceito] = grade.count - grade.eadCount;
    } else {
      result[grade.conceito] = grade.count;
    }
  });
  const ordered = Object.keys(result)
    .sort()
    .reduce((obj: typeof result, key) => {
      obj[key] = result[key];
      return obj;
    }, {});
  return ordered;
};
