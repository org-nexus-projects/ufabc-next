import type { Classes } from '../types';

const CLASSES_CODES_REGES = /[A-Z0-9]{7}[-][0-9]{2}/giu;
const TITLE_REGEX = /(?<=[\d-]\s-\s)(?:.+?)(?=\s\w{1,2}-|$)/giu;
const CAMPUS_REGEX = /(?:Campus\s)(?:Santo\sAndré|São\sBernardo\sdo\sCampo)/giu;
const INFO_CODE_REGEX = /[A-Z0-9]{7}[-][0-9]{2}/giu;
const INFO_CLASS_REGEX = /(?:[A-Z]{1}[0-9]?(?=-(?:Noturno|Matutino)))/gu;
const INFO_TURN_REGEX = /(?:Noturno|Matutino)/giu;
const INFO_TPI_REGEX = /(?!\()(?:\d{1,2}\s-\s\d{1,2}\s-\s\d{1,2})(?=\))/giu;

const DAY_REGEX = /(?:.*-feira)|(?:Sábado)/giu;
const DATE_REGEX = /(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?/giu;
const REPEAT_REGEX =
  /(?!\s-\s)(?:semanal|quinzenal\s\(i\)|quinzenal\s\(ii\))/giu;

function matchOrFallback(string: string) {
  return (regex: RegExp, fallback: string | null, index = 0) => {
    const match = string.match(regex);
    return match ? match[index] : fallback;
  };
}

function isFilled(value: string | null) {
  return value !== null && value !== '';
}

function matchOrNull(string: string) {
  return (regex: RegExp, index = 0) =>
    matchOrFallback(string)(regex, null, index);
}

export function handleSummary(summary: string): Classes {
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
      return summary.slice(c);
    }
    return summary.slice(c, classesIndex[index + 1] - 1);
  });

  // Split the classes by end of line
  const splittedClasses = classes.map((c) =>
    c
      .replaceAll(/\s*<br\s*\/?>\s*/giu, '\n')
      .split(/\n+/giu)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );

  // Get the classes info
  const classesInfo = splittedClasses.map((lines) => {
    const classInfo = { info: '', times: [] as string[] };
    for (const [index, line] of lines.entries()) {
      if (index === 0) {
        classInfo.info = line;
      } else if (line.search(/(?:.*-feira)|(?:Sábado)/giu) !== -1) {
        classInfo.times.push(line);
      }
    }
    return classInfo;
  });

  // Create the final json with the classes
  return classesInfo.map((originalClass) => {
    const matchClassesInfo = matchOrFallback(originalClass.info);
    return {
      campus: matchClassesInfo(CAMPUS_REGEX, 'Campus não identificado'),
      info: [
        {
          content: matchClassesInfo(INFO_CODE_REGEX, 'Código não identificado'),
          title: 'Código',
        },
        {
          content: matchClassesInfo(INFO_CLASS_REGEX, 'Turma não identificada'),
          title: 'Turma',
        },
        {
          content: matchClassesInfo(INFO_TURN_REGEX, 'Turno não identificado'),
          title: 'Turno',
        },
        {
          content: matchClassesInfo(INFO_TPI_REGEX, 'TPI não identificado'),
          title: 'TPI',
        },
      ],
      times: originalClass.times
        .map((t) => ({
          day: matchOrNull(t)(DAY_REGEX),
          end: matchOrNull(t)(DATE_REGEX, 1),
          repeat: matchOrNull(t)(REPEAT_REGEX),
          start: matchOrNull(t)(DATE_REGEX),
        }))
        .filter(
          (time) =>
            isFilled(time.day) &&
            isFilled(time.start) &&
            isFilled(time.end) &&
            isFilled(time.repeat)
        ),
      title: matchClassesInfo(TITLE_REGEX, 'Título não identificado'),
    };
  });
}
