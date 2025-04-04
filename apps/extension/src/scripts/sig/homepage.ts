import { normalizeDiacritics } from '@/utils/remove-diacritics';
import { getStudentGrades, getStudentSig, type CompleteStudent } from '@/services/ufabc-parser';

type SigStudent = {
	matricula: string;
	email: string;
	/** @example 2022:2 */
	entrada: string;
	nivel: 'graduacao' | 'licenciatura';
	status: string;
	curso: string;
};

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

	const rawStudent: SigStudent = Object.fromEntries(kvStudent);
	const student = await getStudentSig({
		...rawStudent,
		sessionId,
	}, 'student');

	if (student.error) {
		return null;
	}

	return student.data;
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
