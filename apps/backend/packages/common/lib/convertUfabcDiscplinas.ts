import {
  camelCase,
  chunk as lodashChunk,
  get as lodashGet,
  startCase,
} from 'lodash-es';
import latinize from 'latinize';

export type Disciplina = {
  nome: string;
  id: string;
  obrigatorias: string[];
  obrigatoriedades: Array<{
    curso_id: string;
    obrigatoriedade: 'limitada' | 'obrigatoria' | 'livre';
  }>;
  campus?: 'santo andre' | 'sao bernardo' | null;
  turno?: 'noturno' | 'diurno' | 'tarde' | null;
  horarios: string | string[];
  turma?: string;
  disciplina: string;
  disciplina_id: string;
  teoria: string | null;
  pratica: string | null;
};

// This convert an disciplina from the .json from matriculas.ufabc
export function convertUfabcDisciplinas(
  disciplina: Disciplina,
): Disciplina | Disciplina[] | null {
  const clonedDisciplinas = structuredClone(disciplina);
  clonedDisciplinas.campus = undefined;
  clonedDisciplinas.turno = undefined;
  clonedDisciplinas.obrigatorias = clonedDisciplinas.obrigatoriedades.map(
    (item) => item.curso_id,
  );

  let afterNoon = false;

  const isNoon =
    clonedDisciplinas.horarios &&
    typeof clonedDisciplinas.horarios === 'object';
  // handle horarios based on pdf or json
  if (isNoon) {
    const startHours: string[] = lodashGet(
      clonedDisciplinas.horarios,
      '[0].horas',
      [],
    );

    afterNoon = ['14:00', '15:00', '16:00', '17:00'].some((hour) =>
      startHours.includes(hour),
    );
  } else if (
    clonedDisciplinas.horarios &&
    typeof clonedDisciplinas.horarios === 'string'
  ) {
    clonedDisciplinas.horarios = removeLineBreaks(clonedDisciplinas.horarios);

    const matchedHorarios = clonedDisciplinas.horarios.match(/\d{2}:\d{2}/g);

    if (!matchedHorarios) {
      return [];
    }

    if (matchedHorarios?.length % 2 === 0) {
      const hours = lodashChunk(matchedHorarios, 2);
      hours.forEach((hour) => {
        const [start] = hour.map((h) => Number.parseInt(h.split(':')[0]!));
        if (start! >= 12 && start! < 18) {
          afterNoon = true;
        }
      });
    }
  }

  // trabalha nas disciplinas
  if (!clonedDisciplinas.nome) {
    return clonedDisciplinas;
  }

  let turnoIndex: number | null = null;
  let breakRule = '-';
  let splitted = removeLineBreaks(clonedDisciplinas.nome).split(breakRule);
  if (splitted.length === 1) {
    breakRule = ' ';
    splitted = splitted[0]!.split(/\s+/);
  }
  splitted.forEach((item, i) => {
    // Theres probably a bug in here
    clonedDisciplinas.campus = clonedDisciplinas.campus || extractCampus(item);
    clonedDisciplinas.turno =
      clonedDisciplinas.turno || extractTurno(item as Disciplina['turno']);

    if (
      (clonedDisciplinas.turno || clonedDisciplinas.campus) &&
      turnoIndex === null
    ) {
      turnoIndex = i;
    }
  });

  if (afterNoon && !clonedDisciplinas.turno) {
    // Theres probably a bug here too
    clonedDisciplinas.turno = 'tarde';
  }

  if (!clonedDisciplinas.campus) {
    if (!turnoIndex) {
      return null;
    }
    const secondPath = splitted.slice(turnoIndex + 1, splitted.length);
    clonedDisciplinas.campus = extractCampus(secondPath.join(breakRule));
  }

  // cut until the index we found
  splitted = splitted.slice(0, turnoIndex!);

  // separa a turma da disciplina
  const ufabcDisciplina = splitted.join('-').split(/\s+/).filter(Boolean);
  clonedDisciplinas.turma = ufabcDisciplina.at(-1);
  ufabcDisciplina.pop();
  // fix disciplina
  clonedDisciplinas.disciplina = ufabcDisciplina.join(' ').trim();

  clonedDisciplinas.disciplina_id = clonedDisciplinas.id;

  if (clonedDisciplinas.teoria === '0' || clonedDisciplinas.teoria === '') {
    clonedDisciplinas.teoria = null;
  }
  if (clonedDisciplinas.pratica === '0' || clonedDisciplinas.pratica === '') {
    clonedDisciplinas.pratica = null;
  }

  if (clonedDisciplinas.teoria !== null) {
    clonedDisciplinas.teoria = cleanTeacher(
      removeLineBreaks(clonedDisciplinas.teoria),
    );
  }
  if (clonedDisciplinas.pratica !== null) {
    clonedDisciplinas.pratica = cleanTeacher(
      removeLineBreaks(clonedDisciplinas.pratica),
    );
  }

  return clonedDisciplinas;
}

const removeLineBreaks = (str: string) => str?.replaceAll(/\r?\n|\r/g, ' ');

const extractCampus = (disciplina: string) => {
  const min = latinize(disciplina!.toLowerCase());
  if (!min) {
    return null;
  }
  if (/.*santo\s+andre.*/.test(min)) {
    return 'santo andre';
  }

  if (/.*sao\s+bernardo.*/.test(min)) {
    return 'sao bernardo';
  }

  return null;
};

const extractTurno = (disciplina: Disciplina['turno']) => {
  // TODO: include `vespertino`

  const min = disciplina?.toLowerCase();
  if (min?.includes('diurno') || min?.includes('matutino')) {
    return 'diurno';
  }

  if (min?.includes('noturno')) {
    return 'noturno';
  }

  return null;
};

const cleanTeacher = (str: string) => {
  return startCase(camelCase(str))
    .replaceAll(/-+.*?-+/g, '')
    .replaceAll(/\(+.*?\)+/g, '');
};
