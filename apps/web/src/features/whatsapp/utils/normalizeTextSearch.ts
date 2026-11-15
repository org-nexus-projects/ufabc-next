export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/gu, '')
    .toLowerCase()
    .trim();
}
