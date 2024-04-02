import type { Disciplina } from './convertUfabcDiscplinas';

type DisciplinaWithError = Disciplina & {
  teoria: {
    error: string;
  };
  pratica: {
    error: string;
  };
};

export function validateTeachers(disciplinas: DisciplinaWithError[]) {
  return disciplinas.reduce<string[]>((acc, d) => {
    if (d.teoria && d.teoria.error) {
      acc.push(d.teoria.error);
    }
    if (d.pratica && d.pratica.error) {
      acc.push(d.pratica.error);
    }
    return acc;
  }, []);
}
