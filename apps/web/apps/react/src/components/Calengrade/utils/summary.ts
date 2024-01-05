import { Classes } from '../context/CalengradeContext';

const CLASSES_CODES_REGES = /[A-Z0-9]{7}[-][0-9]{2}/gi;
const TITLE_REGEX = /(?<=[\d-]\s-\s)(.+?)(?=\s\w{1,2}-|$)/gi;
const CAMPUS_REGEX = /(Campus\s)(Santo\sAndré|São\sBernardo\sdo\sCampo)/gi;
const INFO_CODE_REGEX = /[A-Z0-9]{7}[-][0-9]{2}/gi;
const INFO_CLASS_REGEX = /([A-Z]{1}[0-9]?(?=-(Noturno|Matutino)))/g;
const INFO_TURN_REGEX = /(Noturno|Matutino)/gi;
const INFO_TPI_REGEX = /(?!\()(\d{1,2}\s-\s\d{1,2}\s-\s\d{1,2})(?=\))/gi;

const DAY_REGEX = /(.*-feira)|(Sábado)/gi;
const DATE_REGEX = /([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?/gi;
const REPEAT_REGEX = /(?!\s-\s)(semanal|quinzenal\s\(i\)|quinzenal\s\(ii\))/gi;

const matchOrFallback =
  (string: string) =>
  (regex: RegExp, fallback: string | null, index = 0) => {
    const match = string.match(regex);
    return match ? match[index] : fallback;
  };

const matchOrNull =
  (string: string) =>
  (regex: RegExp, index = 0) =>
    matchOrFallback(string)(regex, null, index);

export const handleSummary = (summary: string): Classes => {
  // Get all classes codes
  const classesCodesRegex = summary.match(CLASSES_CODES_REGES) ?? [];

  if (!classesCodesRegex.length) {
    return [];
  }

  const classesCodes = [...new Set(classesCodesRegex)];

  // Get all classes index
  const classesIndex = classesCodes.map((c) => summary.indexOf(c));

  // Get all classes
  const classes = classesIndex.map((c, index) => {
    if (index === classesIndex.length - 1) {
      return summary.substring(c, summary.length);
    }
    return summary.substring(c, classesIndex[index + 1] - 1);
  });

  // Split the classes by end of line
  const splittedClasses = classes.map((c) => c.split(/\n+/gi));

  // Get the classes info
  const classesInfo = splittedClasses.map((c) =>
    c.reduce(
      (acc, cur, index) => {
        if (index === 0) {
          return {
            info: cur,
            times: [] as string[],
          };
        }
        if (cur.search(/(.*-feira)|(Sábado)/gi) !== -1) {
          acc.times.push(cur);
        }
        return acc;
      },
      {
        info: '',
        times: [] as string[],
      },
    ),
  );

  // Create the final json with the classes
  return classesInfo.map((originalClass) => {
    const matchClassesInfo = matchOrFallback(originalClass.info);
    return {
      title: matchClassesInfo(TITLE_REGEX, 'Título não identificado'),
      campus: matchClassesInfo(CAMPUS_REGEX, 'Campus não identificado'),
      info: [
        {
          title: 'Código',
          content: matchClassesInfo(INFO_CODE_REGEX, 'Código não identificado'),
        },
        {
          title: 'Turma',
          content: matchClassesInfo(INFO_CLASS_REGEX, 'Turma não identificada'),
        },
        {
          title: 'Turno',
          content: matchClassesInfo(INFO_TURN_REGEX, 'Turno não identificado'),
        },
        {
          title: 'TPI',
          content: matchClassesInfo(INFO_TPI_REGEX, 'TPI não identificado'),
        },
      ],
      times: originalClass.times
        .map((t) => ({
          day: matchOrNull(t)(DAY_REGEX),
          start: matchOrNull(t)(DATE_REGEX),
          end: matchOrNull(t)(DATE_REGEX, 1),
          repeat: matchOrNull(t)(REPEAT_REGEX),
        }))
        .filter((time) => time.day && time.start && time.end && time.repeat),
    };
  });
};
