import { definedQuarters } from '@/features/calengrade/utils/quarters';

type QuarterRange = {
  season: string;
  startDate: Date;
  endDate: Date;
};

type GetCurrentAcademicSeasonOptions = {
  now?: Date;
  advanceDays?: number;
};

// para o caso de recesso, antecipa a troca de quadrimestre em alguns dias para evitar confusão dos alunos
export const CURRENT_QUARTER_ADVANCE_DAYS = 20;

const MANUAL_QUARTER_TITLE = 'Definir datas manualmente';

const parseQuarterTitleToSeason = (title: string): string | null => {
  if (!title || title === MANUAL_QUARTER_TITLE) {
    return null;
  }

  const match = title.match(/^(\d)\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, quad, year] = match;
  return `${year}:${quad}`;
};

const toAcademicQuarterRanges = (): QuarterRange[] => {
  return definedQuarters
    .map((quarter) => {
      const season = parseQuarterTitleToSeason(quarter.title);

      if (!season) {
        return null;
      }

      return {
        season,
        startDate: new Date(`${quarter.startDate}T00:00:00`),
        endDate: new Date(`${quarter.endDate}T23:59:59.999`),
      };
    })
    .filter((quarter): quarter is QuarterRange => quarter !== null)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
};

export const academicQuarterRanges = toAcademicQuarterRanges();

export const isValidAcademicSeason = (season: string): boolean => {
  return academicQuarterRanges.some((quarter) => quarter.season === season);
};

export const getCurrentAcademicSeason = (
  options: GetCurrentAcademicSeasonOptions = {},
): string => {
  const { now = new Date(), advanceDays = CURRENT_QUARTER_ADVANCE_DAYS } =
    options;

  const evaluatedDate = new Date(now);
  evaluatedDate.setDate(evaluatedDate.getDate() + advanceDays);

  const currentRange = academicQuarterRanges.find(
    (quarter) =>
      evaluatedDate.getTime() >= quarter.startDate.getTime() &&
      evaluatedDate.getTime() <= quarter.endDate.getTime(),
  );

  if (currentRange) {
    return currentRange.season;
  }

  const newestQuarter = academicQuarterRanges[0];
  const oldestQuarter = academicQuarterRanges[academicQuarterRanges.length - 1];

  if (!newestQuarter || !oldestQuarter) {
    return '';
  }

  if (evaluatedDate.getTime() > newestQuarter.endDate.getTime()) {
    return newestQuarter.season;
  }

  return oldestQuarter.season;
};

export const getSelectableAcademicSeasons = (
  currentSeason: string,
): string[] => {
  const orderedSeasons = academicQuarterRanges.map((quarter) => quarter.season);
  const currentIndex = orderedSeasons.findIndex(
    (season) => season === currentSeason,
  );

  if (currentIndex === -1) {
    return orderedSeasons;
  }

  return orderedSeasons.slice(currentIndex);
};
