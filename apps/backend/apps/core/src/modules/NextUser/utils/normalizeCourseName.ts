export function normalizeCourseName(name: string) {
  if (name === 'Bacharelado em CIências e Humanidades') {
    const validName = 'Bacharelado em Ciências e Humanidades';
    return validName;
  }
  return name;
}
