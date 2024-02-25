export function validateTeachers(disciplinas: any[]) {
  return disciplinas.reduce((acc, d) => {
    if (d.teoria && d.teoria.error) {
      acc.push(d.teoria.error);
    }
    if (d.pratica && d.pratica.error) {
      acc.push(d.pratica.error);
    }
    return acc;
  }, []);
}
