export function getStudentId() {
  const { scripts } = document;
  const searchString = 'todasMatriculas';
  let studentId = null;

  for (const script of scripts) {
    const content = script.textContent || script.innerHTML;
    if (content.includes(searchString)) {
      const regex = /matriculas\[(\d+)\]/;
      const match = regex.exec(content);

      if (match?.[1]) {
        studentId = Number.parseInt(match[1], 10);
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
    const content = script.textContent || script.innerHTML;
    if (content.includes(searchString)) {
      const regex = /cursoAluno\s*=\s*(\d+)/;
      const match = regex.exec(content);

      if (match?.[1]) {
        UFCourseId = match[1];
        break;
      }
    }
  }

  return UFCourseId;
}
