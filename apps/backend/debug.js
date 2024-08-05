import json from '/home/joabesv/Downloads/ufabc-matricula.teachers.json' with {
  type: 'json',
};

const reorder = json.map((t) => ({ name: t.name }));

console.log(JSON.stringify(reorder, null, 2));
