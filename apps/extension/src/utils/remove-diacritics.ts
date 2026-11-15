export function normalizeDiacritics(str: string) {
  return str
    .trim()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/gu, '')
    .replaceAll(/[-:]/gu, '')
    .toLocaleLowerCase();
}
