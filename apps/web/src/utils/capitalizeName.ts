export function capitalizeName(name: string | undefined): string {
  if (name === undefined || name === '') {
    return '';
  }
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
