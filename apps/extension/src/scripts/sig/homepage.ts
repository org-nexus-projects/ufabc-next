import { normalizeDiacritics } from '@/utils/remove-diacritics';
import { getSigStudent, getSigStudentGrades, type CompleteStudent } from '@/services/next'


export async function retrieveStudent(
	pageTrs: NodeListOf<HTMLTableRowElement>,
	sessionId: string,
) {
	const rows = Array.from(pageTrs);
	const kvStudent = rows.map((row) => {
		const $childrens = row.children as HTMLCollectionOf<HTMLElement>;
		const cleaned = Array.from($childrens).map((column) =>
			normalizeDiacritics(column.innerText ?? ''),
		);
		return cleaned;
	});

	const rawStudent = Object.fromEntries(kvStudent);
	const student = await getSigStudent(rawStudent, sessionId);

	if (!student) {
		return null;
	}

	return student;
}

export async function scrapeMenu(
	trs: NodeListOf<HTMLTableRowElement>,
	sessionId: string,
  viewState: string
): Promise<{ data: CompleteStudent | null, error: string | null }> {
	const shallowStudent = await retrieveStudent(trs, sessionId);

	if (!shallowStudent) {
		return {
      error: 'Não Conseguimos Realizar a busca, Tente Novamente Mais Tarde!',
      data: null
    };
	}

  const student = await getSigStudentGrades(
    shallowStudent,
    sessionId,
    viewState,
    'student-report',
  );

  if (!student) {
    return {
      error: 'Could not scrape',
      data: null
    }
  }

  return {
    error: null,
    data: student
  }
}
