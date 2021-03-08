function findQuadFromDate(month) {
  if([0, 1, 10, 11].includes(month)) return 1
  if([2, 3, 4, 5].includes(month)) return 2
  if([6, 7, 8, 9].includes(month)) return 3
}

function findSeason(date = new Date()) {
  const month = date.getMonth()
  return {
    1 : {
      quad: 1,
      year: date.getFullYear() + (month < 6 ? 0 : 1)
    },
    2 : {
      quad: 2,
      year: date.getFullYear()
    },
    3 : {
      quad: 3,
      year: date.getFullYear()
    },
  }[findQuadFromDate(date.getMonth() || month)]
}

export default function findSeasonKey(date) {
  const d = findSeason(date)
  return d.year + ':' + d.quad
}