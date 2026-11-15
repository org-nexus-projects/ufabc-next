import { normalizeDiacritics } from '@/utils/remove-diacritics';


export function retrieveStudent(
	pageTrs: NodeListOf<HTMLTableRowElement>,
) {
	const kvStudent = [...pageTrs].map((row) => {
		const $childrens = row.querySelectorAll<HTMLElement>(':scope > *');
		return [...$childrens].map((column) =>
			// oxlint-disable-next-line unicorn/prefer-dom-node-text-content -- innerText keeps the rendered text used as keys
			normalizeDiacritics(column.innerText),
		);
	});

	const rawStudent = new Map(kvStudent.map((cells) => [cells[0], cells.at(1)]));
	const email = rawStudent.get('email');
	const ra = rawStudent.get('matricula');

	if (email === undefined || ra === undefined) {
		return null;
	}

	return {
	  login: email.split('@')[0],
		ra,
	};
}

export function scrapeMenu(
	trs: NodeListOf<HTMLTableRowElement>,
): { data: { login: string; ra: string } | null, error: string | null } {
	const shallowStudent = retrieveStudent(trs);

	if (!shallowStudent) {
		return {
      data: null,
      error: 'Não Conseguimos Realizar a busca, Tente Novamente Mais Tarde!'
    };
	}

  return {
    data: shallowStudent,
    error: null
  }
}
