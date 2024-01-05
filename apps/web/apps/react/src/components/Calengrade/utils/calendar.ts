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
        time.repeat.indexOf('quinzenal (II)') !== -1
      )
        recurrenceRule += `INTERVAL=2;`;

      recurrenceRule += `UNTIL=${dayjs(endDate).format('YYYYMMDDThhmmss')}Z`;

      let description = '';

      subject.info.forEach((info) => {
        description += `${info.title}: ${info.content}\n`;
      });

      const event = {
        title: subject.title || '',
        location: `UFABC - ${subject.campus}`,
        description,
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
    return value;
  }
};
