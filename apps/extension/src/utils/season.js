function findQuadFromDate(month) {
  if ([0, 1, 2, 10, 11].includes(month)) {
    return 1;
  }
  if ([3, 4, 5].includes(month)) {
    return 2;
  }
  if ([6, 7, 8, 9].includes(month)) {
    return 3;
  }
}

function findSeason(date = new Date()) {
  const month = date.getMonth();
  return {
    1: {
      quad: 1,
      year: date.getFullYear() + (month < 6 ? 0 : 1),
    },
    2: {
      quad: 2,
      year: date.getFullYear(),
    },
    3: {
      quad: 3,
      year: date.getFullYear(),
    },
  }[findQuadFromDate(date.getMonth() || month)];
}

function findSeasonKey(date) {
  const { year, quad } = findSeason(date);
  return `${year}:${quad}`;
}

function findIdeais(date) {
  return {
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
  }[findQuadFromDate(date || new Date().getMonth())];
}

module.exports = {
  findSeason,
  findSeasonKey,
  findIdeais,
};
