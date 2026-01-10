db = db.getSiblingDB('ufabc-matricula');
db.createCollection('alunos');

db.alunos.insertMany([
  {
    ra: 1234567890,
    aluno_id: 1234,
    login: 'next.dev',
    season: '2024:3',
    cursos: [
      {
        cp: 1,
        cr: 4,
        turno: 'Noturno',
        nome_curso: 'Bacharelado em Ciência e Tecnologia',
        ind_afinidade: 0,
        id_curso: 74,
      },
    ],
  },
]);
