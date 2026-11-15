import dayjs from 'dayjs';

export function getSeason(date = dayjs()) {
  const year = date.year();
  const month = date.month();

  let quad;
  if (month < 3) {
    quad = 1;
  } else if (month < 7) {
    quad = 2;
  } else {
    quad = 3;
  }

  return `${year}:${quad}`;
}

type getElapsedSeasonsProps = {
  startSeason?: string;
  endSeason: string;
};

export function getElapsedSeasons({
  startSeason = '2019:1',
  endSeason,
}: getElapsedSeasonsProps) {
  let currentSeason = startSeason;
  const seasons = [startSeason];
  while (currentSeason !== endSeason) {
    let year = Number(currentSeason.split(':')[0]);
    let quad = Number(currentSeason.split(':')[1]);
    if (quad === 3) {
      quad = 1;
      year += 1;
    } else {
      quad += 1;
    }
    currentSeason = `${year}:${quad}`;
    seasons.push(currentSeason);
  }

  return seasons;
}

export function checkEAD(year: string | number, quad: string | number) {
  const possibles = getElapsedSeasons({
    endSeason: '2022:2',
    startSeason: '2020:1',
  });

  return possibles.includes(`${year}:${quad}`);
}

export function formatSeason(season: string) {
  const [year, quad] = season.split(':');
  return `Q${quad} ${year}`;
}

export function prettifySeason(season: string) {
  const [year, quad] = season.split(':');
  return `${quad}º quadrimestre de ${year}`;
}
