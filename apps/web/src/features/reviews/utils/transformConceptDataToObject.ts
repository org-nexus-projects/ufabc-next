import type { ConceptData } from '@next/services';

export function transformConceptDataToObject(
  grades: ConceptData[],
  eadFilter?: boolean
) {
  const result: Record<string, number> = {};
  for (const grade of grades) {
    result[grade.conceito] =
      eadFilter === true ? grade.count - grade.eadCount : grade.count;
  }
  const ordered: Record<string, number> = {};
  for (const key of Object.keys(result).sort()) {
    ordered[key] = result[key];
  }
  return ordered;
}
