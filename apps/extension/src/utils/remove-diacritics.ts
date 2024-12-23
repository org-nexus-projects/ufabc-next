export function normalizeDiacritics(str: string) {
	return str
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[-:]/g, "")
		.toLocaleLowerCase();
}
