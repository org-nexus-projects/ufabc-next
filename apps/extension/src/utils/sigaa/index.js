// todo: save to localStorage

function normalizeDiacritics(stringElement) {
  return stringElement
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-:]/g, '')
    .toLocaleLowerCase();
}

function scrapeGradesConsulting() {
  const sigaaUpdatetime = document
    .querySelector('.dataAtual')
    .textContent.trim();

  const [day, month, year, hour, minute] = sigaaUpdatetime.match(/\d+/g);
  const updateDatetime = new Date(year, month - 1, day, hour, minute);

  // * dados do aluno
  const studentDataHTML = document.querySelector(
    '#identificacao > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(1) > td',
  ).textContent;
  const courseHTML = document.querySelector(
    '#identificacao > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td',
  );
  const studentCourse = courseHTML.innerText;
  const [, ra] = studentDataHTML.trim().split(' - ');

  const quadsTableElement = document.querySelectorAll('.tabelaRelatorio');
  const quadsTable = Array.from(quadsTableElement);

  const studentDisciplinaHistory = [];
  for (const tableElement of quadsTable) {
    const studentseason = tableElement.querySelector('caption');
    const [year, quad] = studentseason.textContent.trim().split('.');

    const tableHeadersElement = tableElement.querySelectorAll('th');
    const tableRowsElement = tableElement.querySelectorAll('tbody > tr');
    const rawTableHeaders = Array.from(tableHeadersElement);

    const wantedFields = ['codigo', 'disciplina', 'resultado', 'situacao'];
    const indexWantedFields = [];
    const tableHeaders = rawTableHeaders.filter((rawItem, index) => {
      const item = normalizeDiacritics(rawItem.innerText);

      if (wantedFields.includes(item)) {
        // crimes
        indexWantedFields.push(index);
      }

      return wantedFields.includes(item);
    });

    const tableRows = Array.from(tableRowsElement);
    for (const row of tableRows) {
      const rowChildrens = Array.from(row.children);
      const cells = rowChildrens
        .filter((_, index) => indexWantedFields.includes(index))
        .map((cellHTML) => cellHTML.innerText); // picking exact header positions

      const disciplina = {};

      cells.forEach((item, index) => {
        const normalizedHeaderText = normalizeDiacritics(
          tableHeaders[index].textContent,
        );
        disciplina[normalizedHeaderText] = item;
      });

      disciplina.ano = year;
      disciplina.periodo = quad;

      studentDisciplinaHistory.push(disciplina);
    }
  }

  const userHistory = {
    updateTime: updateDatetime,
    curso: studentCourse,
    ra: Number(ra),
    disciplinas: studentDisciplinaHistory,
  };

  return userHistory;
}

function scrapeHomepage() {
  const trs = document.querySelectorAll('#agenda-docente tbody tr');
  const tablesRowsArray = Array.from(trs);
  const rawStudentInfo = tablesRowsArray.map((line) =>
    Array.from(line.children).map((column) =>
      normalizeDiacritics(column.innerText),
    ),
  );

  const [rawName] = document.querySelectorAll('#perfil-docente p.info-docente');
  const [name] = rawName.textContent.split(/\n\n\t+\n\t+/);
  const studentInfo = Object.fromEntries(rawStudentInfo);
  const courseInfo = studentInfo.curso.split('  ');

  studentInfo.curso = courseInfo[0];
  let turno = courseInfo[courseInfo.length - 1];

  if (turno === 'n') turno = 'noturno';
  if (turno === 'm') turno = 'matutino';

  return {
    name: name.trim(),
    studentInfo,
    turno: turno,
  };
}

module.exports = {
  normalizeDiacritics,
  scrapeGradesConsulting,
  scrapeHomepage,
};
