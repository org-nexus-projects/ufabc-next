import dayjs from 'dayjs';

import { PERMISSIONS } from '@/utils/consts';

export type InternalNavItem = {
  title: string;
  icon: string;
  route: string;
  releaseDate?: dayjs.Dayjs;
  locked: (confirmed: boolean) => boolean;
};

export type ExternalNavItem = {
  title: string;
  icon: string;
  url: string;
};

const hasAdminPermission = (permissions: string[]) =>
  permissions.includes(PERMISSIONS.ADMIN);

const hasAccessToAnnouncements = (permissions: string[]) =>
  hasAdminPermission(permissions) ||
  permissions.some((permission) =>
    permission.includes(PERMISSIONS.ANNOUNCEMENTS),
  );

export const internalNavigationItems: InternalNavItem[] = [
  {
    title: 'Reviews',
    icon: 'mdi-message-draw',
    route: '/reviews',
    locked: (confirmed) => !confirmed,
  },
  {
    title: 'Meu histórico',
    icon: 'mdi-history',
    route: '/history',
    locked: (confirmed) => !confirmed,
  },
  {
    title: 'Performance',
    icon: 'mdi-google-analytics',
    route: '/performance',
    locked: (confirmed) => !confirmed,
  },
  {
    title: 'Dados da Matrícula',
    icon: 'mdi-book-multiple',
    route: '/stats',
    locked: (confirmed) => !confirmed,
  },
  {
    title: 'Grupos no WhatsApp',
    icon: 'mdi-whatsapp',
    route: '/grupos-whatsapp',
    releaseDate: dayjs('07/10/2025'),
    locked: () => false,
  },
  {
    title: 'Calengrade',
    icon: 'mdi-calendar',
    route: '/calengrade',
    releaseDate: dayjs('11/25/2023'),
    locked: () => false,
  },
  {
    title: 'Apoie o UFABC next',
    icon: 'mdi-bank',
    route: '/donate',
    locked: () => false,
  },
  {
    title: 'Ajuda',
    icon: 'mdi-help-circle',
    route: '/help',
    locked: () => false,
  },
];

export const getInternalNavigationItems = ({
  permissions,
}: {
  permissions: string[];
}): InternalNavItem[] => [
  ...internalNavigationItems.slice(0, 5),
  ...(hasAccessToAnnouncements(permissions)
    ? [
        {
          title: 'Anúncios',
          icon: 'mdi-bullhorn',
          route: '/announcements',
          locked: () => false,
        },
      ]
    : []),
  ...internalNavigationItems.slice(5),
];

export const getExternalNavigationItems = ({
  apiURL,
  token,
  permissions,
}: {
  apiURL: string;
  token: string | null;
  permissions: string[];
}): ExternalNavItem[] => [
  {
    title: 'Discord',
    icon: 'fa-brands fa-discord',
    url: 'https://discord.gg/7BBzDwRXSg',
  },
  {
    title: 'Snapshot da Matrícula',
    icon: 'mdi-open-in-new',
    url: 'https://ufabc-matricula-snapshot.vercel.app',
  },
  {
    title: 'Use a Extensão',
    icon: 'mdi-download',
    url: 'https://chrome.google.com/webstore/detail/ufabc-next/gphjopenfpnlnffmhhhhdiecgdcopmhk',
  },
  ...(hasAdminPermission(permissions)
    ? [
        {
          title: 'Monitoramento de Jobs',
          icon: 'mdi-open-in-new',
          url: `${apiURL}/board/ui?token=${token}`,
        },
      ]
    : []),
  ...(hasAdminPermission(permissions)
    ? [
        {
          title: 'Monitoramento de Jobs V2',
          icon: 'mdi-open-in-new',
          url: `${apiURL}/v2/board/ui?token=${token}`,
        },
      ]
    : []),
];
