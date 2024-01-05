export function validateTeachers(disciplinas: any[]) {
  return disciplinas.flatMap((d) => [
    ...(d.teoria && d.teoria.error ? [d.teoria.error] : []),
    ...(d.pratica && d.pratica.error ? [d.pratica.error] : []),
  ]);
}
