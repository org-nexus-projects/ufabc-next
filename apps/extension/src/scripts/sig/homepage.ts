import { normalizeDiacritics } from '@/utils/remove-diacritics';
import { getStudentGrades, type CompleteStudent } from '@/services/ufabc-parser';
import { getSigStudent } from '@/services/next'


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

  const { data: student, error } = await getStudentGrades({
    ...shallowStudent,
    sessionId,
  }, viewState, 'student-report');

  if (error) {
    return {
      error,
      data: null
    }
  }

  return {
    error: null,
    data: student
  }
}
