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
  const ideais: Record<number,string[]> = {
    1: [
      'BCM0506-15', // COMUNICACAO E REDES
      'BCJ0203-15', // ELETROMAG
      'BIN0406-15', // IPE
      'BCN0405-15', // IEDO
      'BIR0004-15', // EPISTEMOLOGICAS
      'BHO0102-15', // DESENVOL. E SUSTE.
      'BHO0002-15', // PENSA. ECONOMICO
      'BHP0201-15', // TEMAS E PROBLEMAS
      'BHO0101-15', // ESTADO E RELA
      'BIR0603-15', // CTS
      'BHQ0003-15', // INTEPRE. BRASIL
      'BHQ0001-15', // IDENT.E CULTURA
    ],
    2: [
      'BCM0504-15', // NI
      'BCN0404-15', // GA
      'BCN0402-15', // FUV
      'BCJ0204-15', // FEMEC
      'BCL0306-15', // BIODIVERSIDADE
      'BCK0103-15', // QUANTICA
      'BCL0308-15', // BIOQUIMICA
      'BIQ0602-15', // EDS
      'BHO1335-15', // FORMACAO SISTEMA INTERNACIONAL
      'BHO1101-15', // INTRODUCAO A ECONOMIA
      'BHO0001-15', // INTRODUCAO AS HUMANIDADES
      'BHP0202-15', // PENSAMENTO CRITICO
    ],
    3: [
      'BCJ0205-15', // FETERM
      'BCM0505-15', // PI
      'BCN0407-15', // FVV
      'BCL0307-15', // TQ
      'BCK0104-15', // IAM
      'BIR0603-15', // CTS
      'BHP0001-15', // ETICA E JUSTICA
      'BHQ0301-15', // TERRITORIO E SOCIEDADE
      // ESTUDO ÉTNICOS RACIAIS
    ],
  };
  return ideais[quad] || [];
}
