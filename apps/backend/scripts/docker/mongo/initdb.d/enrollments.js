db = db.getSiblingDB('ufabc-matricula');
db.createCollection('enrollments');

db.enrollments.insertMany([
  {
    year: 2024,
    quad: 3,
    ra: 1234567890,
    codigo: 'NA2ESTG017-17SB',
    disciplina: 'Abordagens Tradicionais das Relações Internacionais',
    campus: 'sao bernardo',
    turno: 'noturno',
    turma: 'A2',
    identifier: '79788a4ea84a724f1c6106fd8b33ecda',
    conceito: 'B',
    creditos: 3,
  },
  {
    year: 2024,
    quad: 3,
    ra: 1234567890,
    codigo: 'NA2ESTG017-17SB',
    disciplina: 'Geometria Analítica',
    campus: 'sao bernardo',
    turno: 'noturno',
    turma: 'A2',
    identifier: '79788a4ea84a724f1c6106fd8b33ecda',
    conceito: 'D',
    creditos: 3,
  },
  {
    year: 2024,
    quad: 3,
    ra: 1234567890,
    codigo: 'NA2ESTG017-17SB',
    disciplina: 'Bases Computacionais da Ciência',
    campus: 'sao bernardo',
    turno: 'noturno',
    turma: 'A2',
    identifier: '79788a4ea84a724f1c6106fd8b33ecda',
    conceito: 'A',
    creditos: 2,
  },
]);
