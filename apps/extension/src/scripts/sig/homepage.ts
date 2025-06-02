import { normalizeDiacritics } from '@/utils/remove-diacritics';


export function retrieveStudent(
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

	if (!rawStudent) {
		return null;
	}

	return {
	  login: rawStudent.email.split('@')[0],
		ra: rawStudent.matricula,
	};
}

export function scrapeMenu(
	trs: NodeListOf<HTMLTableRowElement>,
	sessionId: string,
  viewState: string
): { data: { login: string; ra: string } | null, error: string | null } {
	const shallowStudent = retrieveStudent(trs, sessionId);

	if (!shallowStudent) {
		return {
      error: 'Não Conseguimos Realizar a busca, Tente Novamente Mais Tarde!',
      data: null
    };
	}

  if (!shallowStudent) {
    return {
      error: 'Could not scrape',
      data: null
    }
  }

  return {
    error: null,
    data: shallowStudent
  }
}
