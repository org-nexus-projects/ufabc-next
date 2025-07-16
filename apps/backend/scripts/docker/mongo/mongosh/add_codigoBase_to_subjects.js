// Usage: mongosh ufabc-matricula update_uf_subject_code.js
// This script updates each subject in 'subjects' with an array of unique 'uf_subject_code' values based on normalized codes from 'disciplinas'.
// If a subject is associated with multiple codes, it logs a warning for manual review.

function normalizeCodigo(codigo) {
  if (!codigo) return null;
  var match = codigo.match(/^(.*?)-\d{2}$/);
  return match ? match[1] : codigo;
}

print('Aggregating normalized codes from disciplinas...');
const mapping = db.disciplinas.aggregate([
  { $match: { codigo: { $exists: true, $ne: null }, subject: { $exists: true, $ne: null } } },
  {
    $project: {
      codigoBase: { $regexFind: { input: "$codigo", regex: /^(.*?)-\d{2}$/ } },
      subject: 1
    }
  },
  {
    $project: {
      codigoBase: { $cond: [{ $ne: ["$codigoBase", null] }, { $arrayElemAt: ["$codigoBase.captures", 0] }, "$codigo"] },
      subject: 1
    }
  },
  {
    $group: {
      _id: "$subject",
      codigoBases: { $addToSet: "$codigoBase" }
    }
  }
]);

let updated = 0;
let warnings = 0;

print('Updating subjects with uf_subject_code array...');
while (mapping.hasNext()) {
  const doc = mapping.next();
  const subjectId = doc._id;
  const codes = Array.from(new Set(doc.codigoBases.filter(Boolean)));
  if (codes.length === 0) continue;
  if (codes.length > 1) {
    print(`WARNING: Subject ${subjectId} has multiple uf_subject_code values: ${(codes)}`);
    warnings++;
  }
  const res = db.subjects.updateOne(
    { _id: subjectId },
    { $set: { uf_subject_code: codes } }
  );
  if (res.modifiedCount > 0) updated++;
}

print(`\nUpdate complete. Subjects updated: ${updated}`);
print(`Subjects with multiple uf_subject_code values: ${warnings}`);
print('Done.');
