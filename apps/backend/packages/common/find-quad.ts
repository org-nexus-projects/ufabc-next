function findQuadFromDate(month: number) {
  if ([0, 1, 10, 11].includes(month)) return 1;
  if ([2, 3, 4].includes(month)) return 2;
  if ([5, 6, 7, 8, 9].includes(month)) return 3;
}

export function currentQuad(date?: Date) {
  const { quad, year } = findQuarter(date);
  return `${year}:${quad}`;
}

export function findQuarter(date = new Date()) {
  const month = date.getMonth();
  const quadKey = findQuadFromDate(month);

  if (!quadKey) {
    // maybe sentry to track error
    throw Error('Quadkey cannot be empty');
  }

  const quarterMap = {
    1: {
      quad: 1,
      year: date.getFullYear() + (month < 6 ? 0 : 1),
    },
    2: {
      quad: 2,
      year: date.getFullYear(),
    },
    3: {
      quad: 3,
      year: date.getFullYear(),
    },
  };

  return quarterMap[quadKey || month];
}
