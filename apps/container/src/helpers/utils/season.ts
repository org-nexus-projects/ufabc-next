import dayjs from 'dayjs';

export const getSeason = (date = dayjs()) => {
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
};

type getElapsedSeasonsProps = {
  startSeason?: string;
  endSeason: string;
};

export const getElapsedSeasons = ({
  startSeason = '2019:1',
  endSeason,
}: getElapsedSeasonsProps) => {
  let currentSeason = startSeason;
  const seasons = [startSeason];
  while (currentSeason != endSeason) {
    let year = Number(currentSeason.split(':')[0]);
    let quad = Number(currentSeason.split(':')[1]);
    if (quad == 3) {
      quad = 1;
      year++;
    } else {
      quad++;
    }
    currentSeason = year + ':' + quad;
    seasons.push(currentSeason);
  }

  return seasons;
};

export const checkEAD = (year: string | number, quad: string | number) => {
  const possibles = getElapsedSeasons({
    startSeason: '2020:1',
    endSeason: '2022:2',
  });

  return possibles.includes(`${year}:${quad}`);
};

export const formatSeason = (season: string) => {
  const [year, quad] = season.split(':');
  return `Q${quad} ${year}`;
};

export const prettifySeason = (season: string) => {
  const [year, quad] = season.split(':');
  return `${quad}º quadrimestre de ${year}`;
};
