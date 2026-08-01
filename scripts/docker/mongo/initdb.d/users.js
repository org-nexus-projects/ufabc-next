db = db.getSiblingDB('ufabc-matricula');
db.createCollection('users');

db.users.insertMany([
  {
    confirmed: true,
    active: true,
    ra: 1234567890,
    email: 'next.dev@aluno.ufabc.edu.br',
    permissions: [],
  },
]);
