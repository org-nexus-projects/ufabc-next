export function normalizeCourseName(name: string) {
  if (name === 'Bacharelado em CIências e Humanidades') {
    name = 'Bacharelado em Ciências e Humanidades';
    return name;
  }
  return name;
}
