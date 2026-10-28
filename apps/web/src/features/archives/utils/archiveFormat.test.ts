import { cleanFileName, formatScheduleDate } from './archiveFormat';

describe('archiveFormat', () => {
  test('formats ISO schedule dates as day and month', () => {
    expect(formatScheduleDate('2026-09-14')).toBe('14/09');
  });

  test('keeps schedule dates that are not ISO untouched', () => {
    expect(formatScheduleDate('06/10')).toBe('06/10');
  });

  test('replaces control characters found in real file names', () => {
    expect(cleanFileName('Aula_4_-_Como_buscar\n_armazenar.pdf')).toBe(
      'Aula_4_-_Como_buscar _armazenar.pdf'
    );
  });
});
