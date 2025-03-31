import dayjs, { Dayjs } from 'dayjs';
import * as ics from 'ics';

import { Calendar } from '../context/CalengradeContext';

const dayOfWeekReturnMappings = {
  Domingo: {
    number: 0,
    short: 'SU',
  },
  'Segunda-feira': {
    number: 1,
    short: 'MO',
  },
  'Terça-feira': {
    number: 2,
    short: 'TU',
  },
  'Quarta-feira': {
    number: 3,
    short: 'WE',
  },
  'Quinta-feira': {
    number: 4,
    short: 'TH',
  },
  'Sexta-feira': {
    number: 5,
    short: 'FR',
  },
  Sábado: {
    number: 6,
    short: 'SA',
  },
} as const;

type DayOfWeekReturnMappings = typeof dayOfWeekReturnMappings;

const getDayInfo = (day: string | null) => {
  let value;
  Object.keys(dayOfWeekReturnMappings).forEach((dayOfWeek) => {
    if (day?.indexOf(dayOfWeek) !== -1) {
      value =
        dayOfWeekReturnMappings[dayOfWeek as keyof DayOfWeekReturnMappings];
    }
  });
  if (value) return value;
  return dayOfWeekReturnMappings.Domingo;
};

const formatEventDate = (date: Dayjs): ics.DateArray =>
  date
    .format('YYYY-M-D-H-m')
    .split('-')
    .map((str) => Number(str)) as ics.DateArray;

// Function to sanitize text for iCalendar
const sanitizeText = (text: string | null): string => {
  if (!text) return '';

  // Remove or replace problematic characters
  return text
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

export const handleCalendar = ({ classes, startDate, endDate }: Calendar) => {
  const calendar: ics.EventAttributes[] = [];

  classes.forEach((subject) => {
    subject.times.forEach((time) => {
      let startOfPeriod = dayjs(`${startDate}T00:00:00.000`);
      const day = getDayInfo(time.day).number;

      if (startOfPeriod.day() <= day) {
        startOfPeriod = startOfPeriod.add(day - startOfPeriod.day(), 'days');
      } else {
        startOfPeriod = startOfPeriod.add(startOfPeriod.day() + day, 'days');
      }

      if (time.repeat?.indexOf('quinzenal (II)') !== -1) {
        startOfPeriod = startOfPeriod.add(7, 'days');
      }

      let start = startOfPeriod.clone();
      let end = startOfPeriod.clone();

      start = start.add(Number(time.start?.split(':')[0]), 'hours');
      start = start.add(Number(time.start?.split(':')[1]), 'minutes');
      end = end.add(Number(time.end?.split(':')[0]), 'hours');
      end = end.add(Number(time.end?.split(':')[1]), 'minutes');

      let recurrenceRule = `FREQ=WEEKLY;`;
      recurrenceRule += `BYDAY=${getDayInfo(time.day).short};`;

      if (time.repeat?.indexOf('semanal') !== -1)
        recurrenceRule += `INTERVAL=1;`;
      else if (
        time.repeat?.indexOf('quinzenal (I)') !== -1 ||
        time.repeat?.indexOf('quinzenal (II)') !== -1
      )
        recurrenceRule += `INTERVAL=2;`;

      recurrenceRule += `UNTIL=${dayjs(endDate).format('YYYYMMDDThhmmss')}Z`;

      let description = '';
      subject.info.forEach((info) => {
        // Sanitize description content
        const sanitizedTitle = sanitizeText(info.title);
        const sanitizedContent = sanitizeText(info.content);
        description += `${sanitizedTitle}: ${sanitizedContent}\n`;
      });

      const event = {
        title: sanitizeText(subject.title) || '',
        location: `UFABC - ${sanitizeText(subject.campus)}`,
        description: description,
        status: 'CONFIRMED' as const,
        start: formatEventDate(start),
        startInputType: 'local' as const,
        startOutputType: 'local' as const,
        end: formatEventDate(end),
        endInputType: 'local' as const,
        endOutputType: 'local' as const,
        recurrenceRule,
      };

      calendar.push(event);
    });
  });

  const { error, value } = ics.createEvents(calendar);

  if (error) {
    console.log('ERROR: ', error);
    return undefined;
  } else {
    // Add UTF-8 header to the ICS file
    if (value) {
      // Add the charset property to the PRODID field
      return value.replace('PRODID:', 'PRODID;CHARSET=UTF-8:');
    }
    return value;
  }
};
