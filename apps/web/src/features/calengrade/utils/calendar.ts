import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import * as ics from 'ics';

import { logger } from '@/utils/logger';

import type { Calendar } from '../types';

const dayOfWeekReturnMappings = {
  Domingo: {
    number: 0,
    short: 'SU',
  },
  'Quarta-feira': {
    number: 3,
    short: 'WE',
  },
  'Quinta-feira': {
    number: 4,
    short: 'TH',
  },
  'Segunda-feira': {
    number: 1,
    short: 'MO',
  },
  'Sexta-feira': {
    number: 5,
    short: 'FR',
  },
  Sábado: {
    number: 6,
    short: 'SA',
  },
  'Terça-feira': {
    number: 2,
    short: 'TU',
  },
} as const;

type DayOfWeekReturnMappings = typeof dayOfWeekReturnMappings;

function getDayInfo(day: string | null) {
  let value: DayOfWeekReturnMappings[keyof DayOfWeekReturnMappings] | undefined;
  for (const [dayOfWeek, info] of Object.entries(dayOfWeekReturnMappings)) {
    const matches = day === null || day.includes(dayOfWeek);
    if (matches && (value === undefined || info.number > value.number)) {
      value = info;
    }
  }
  return value ?? dayOfWeekReturnMappings.Domingo;
}

function formatEventDate(date: Dayjs): ics.DateArray {
  return [
    date.year(),
    date.month() + 1,
    date.date(),
    date.hour(),
    date.minute(),
  ];
}

// Function to sanitize text for iCalendar
function sanitizeText(text: string | null): string {
  if (text === null || text === '') {
    return '';
  }

  return text
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/gu, '')
    .replaceAll(/[^\p{ASCII}]/gu, '')
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');
}

export function handleCalendar({ classes, startDate, endDate }: Calendar) {
  const calendar: ics.EventAttributes[] = [];

  for (const subject of classes) {
    for (const time of subject.times) {
      let startOfPeriod = dayjs(`${startDate}T00:00:00.000`);
      const day = getDayInfo(time.day).number;

      startOfPeriod =
        startOfPeriod.day() <= day
          ? startOfPeriod.add(day - startOfPeriod.day(), 'days')
          : startOfPeriod.add(startOfPeriod.day() + day, 'days');

      const { repeat } = time;
      if (repeat === null || repeat.includes('quinzenal (II)')) {
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

      if (repeat === null || repeat.includes('semanal')) {
        recurrenceRule += `INTERVAL=1;`;
      } else if (
        repeat.includes('quinzenal (I)') ||
        repeat.includes('quinzenal (II)')
      ) {
        recurrenceRule += `INTERVAL=2;`;
      }

      recurrenceRule += `UNTIL=${dayjs(endDate).format('YYYYMMDDThhmmss')}Z`;

      let description = '';
      for (const info of subject.info) {
        const sanitizedTitle = sanitizeText(info.title);
        const sanitizedContent = sanitizeText(info.content);
        description += `${sanitizedTitle}: ${sanitizedContent}\n`;
      }

      const event = {
        description,
        end: formatEventDate(end),
        endInputType: 'local' as const,
        endOutputType: 'local' as const,
        location: `UFABC - ${sanitizeText(subject.campus)}`,
        recurrenceRule,
        start: formatEventDate(start),
        startInputType: 'local' as const,
        startOutputType: 'local' as const,
        status: 'CONFIRMED' as const,
        title: sanitizeText(subject.title) || '',
      };

      calendar.push(event);
    }
  }

  const { error, value } = ics.createEvents(calendar);

  if (error) {
    logger.error({ error }, 'Calendar creation error');
    return;
  }
  // Add UTF-8 header to the ICS file
  if (value != null) {
    // Add the charset property to the PRODID field
    return value.replace('PRODID:', 'PRODID;CHARSET=UTF-8:');
  }
  return value;
}
