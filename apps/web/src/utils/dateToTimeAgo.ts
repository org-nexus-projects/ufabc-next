import dayjs from 'dayjs';
import ptBr from 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale(ptBr);

export function dateToTimeAgo(date: string) {
  return dayjs(date).fromNow(true);
}
