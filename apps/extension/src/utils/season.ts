import dayjs from 'dayjs';

type Season = {
  quad: number;
  year: number;
};

export function findQuadFromDate(month: number): number {
  if ([0, 1, 2, 10, 11].includes(month)) {
    return 1;
  }
  if ([3, 4, 5].includes(month)) {
    return 2;
  }
  if ([6, 7, 8, 9].includes(month)) {
    return 3;
  }
  throw new Error('Invalid month');
}

export function findSeason(date: dayjs.Dayjs = dayjs()): Season {
  const month = date.month();
  const quad = findQuadFromDate(month);
  return {
    quad,
    year: date.year() + (quad === 1 && month >= 10 ? 1 : 0),
  };
}

export function findSeasonKey(date: dayjs.Dayjs = dayjs()): string {
  const { year, quad } = findSeason(date);
  return `${year}:${quad}`;
}

export function findIdeais(date: dayjs.Dayjs = dayjs()): string[] {
  const quad = findQuadFromDate(date.month());
  const ideais: Record<number, string[]> = {
    1: [
      // COMUNICACAO E REDES
      'BCM0506-15',
      // ELETROMAG
      'BCJ0203-15',
      // IPE
      'BIN0406-15',
      // IEDO
      'BCN0405-15',
      // EPISTEMOLOGICAS
      'BIR0004-15',
      // DESENVOL. E SUSTE.
      'BHO0102-15',
      // PENSA. ECONOMICO
      'BHO0002-15',
      // TEMAS E PROBLEMAS
      'BHP0201-15',
      // ESTADO E RELA
      'BHO0101-15',
      // CTS
      'BIR0603-15',
      // INTEPRE. BRASIL
      'BHQ0003-15',
      // IDENT.E CULTURA
      'BHQ0001-15',
    ],
    2: [
      // NI
      'BCM0504-15',
      // GA
      'BCN0404-15',
      // FUV
      'BCN0402-15',
      // FEMEC
      'BCJ0204-15',
      // BIODIVERSIDADE
      'BCL0306-15',
      // QUANTICA
      'BCK0103-15',
      // BIOQUIMICA
      'BCL0308-15',
      // EDS
      'BIQ0602-15',
      // FORMACAO SISTEMA INTERNACIONAL
      'BHO1335-15',
      // INTRODUCAO A ECONOMIA
      'BHO1101-15',
      // INTRODUCAO AS HUMANIDADES
      'BHO0001-15',
      // PENSAMENTO CRITICO
      'BHP0202-15',
    ],
    3: [
      // FETERM
      'BCJ0205-15',
      // PI
      'BCM0505-15',
      // FVV
      'BCN0407-15',
      // TQ
      'BCL0307-15',
      // IAM
      'BCK0104-15',
      // CTS
      'BIR0603-15',
      // ETICA E JUSTICA
      'BHP0001-15',
      // TERRITORIO E SOCIEDADE
      'BHQ0301-15',
      // ESTUDO ÉTNICOS RACIAIS
    ],
  };
  return ideais[quad] ?? [];
}
