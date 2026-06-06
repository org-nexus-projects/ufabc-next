export function getStudentId() {
  const scripts = document.scripts;
	const searchString = "todasMatriculas";
	let studentId = null;

	for (const script of Array.from(scripts)) {
		const content = script.textContent || script.innerHTML;
		if (content.includes(searchString)) {
			const regex = /matriculas\[(\d+)\]/;
			const match = content.match(regex);

			if (match?.[1]) {
				studentId = Number.parseInt(match[1], 10);
				break; // Interrompe o loop quando o ID é encontrado
			}
		}
	}

	return studentId;
}

export function getStudentCourseId() {
  const searchString = "cursoAluno";
  let UFCourseId = null;

  const scripts = document.scripts;
  for (const script of Array.from(scripts)) {
    const content = script.textContent || script.innerHTML;
    if (content.includes(searchString)) {
      const regex = /cursoAluno\s*=\s*(\d+)/;
      const match = content.match(regex);

      if (match?.[1]) {
        UFCourseId = match[1];
        break;
      }
    }
  }


  return UFCourseId;
}
