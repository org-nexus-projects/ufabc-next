import dayjs from 'dayjs';
import ptBr from 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale(ptBr);

export const dateToTimeAgo = (date: string) => dayjs(date).fromNow(true);
