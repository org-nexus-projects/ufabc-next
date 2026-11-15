export function getStudentId() {
  const { scripts } = document;
  const searchString = 'todasMatriculas';
  let studentId = null;

  for (const script of scripts) {
    const content = script.textContent ?? script.innerHTML;
    if (content.includes(searchString)) {
      const regex = /matriculas\[(?<id>\d+)\]/u;
      const id = regex.exec(content)?.groups?.id;

      if (id !== undefined && id !== '') {
        studentId = Number(id);
        // Interrompe o loop quando o ID é encontrado
        break;
      }
    }
  }

  return studentId;
}

export function getStudentCourseId() {
  const searchString = 'cursoAluno';
  let UFCourseId = null;

  const { scripts } = document;
  for (const script of scripts) {
    const content = script.textContent ?? script.innerHTML;
    if (content.includes(searchString)) {
      const regex = /cursoAluno\s*=\s*(?<id>\d+)/u;
      const id = regex.exec(content)?.groups?.id;

      if (id !== undefined && id !== '') {
        UFCourseId = id;
        break;
      }
    }
  }

  return UFCourseId;
}
