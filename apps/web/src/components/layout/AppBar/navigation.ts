import dayjs from 'dayjs';

export type InternalNavItem = {
  title: string;
  permissions?: string[];
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

export const internalNavigationItems: InternalNavItem[] = [
  {
    icon: 'mdi-message-draw',
    locked: (confirmed) => !confirmed,
    route: '/reviews',
    title: 'Reviews',
  },
  {
    icon: 'mdi-history',
    locked: (confirmed) => !confirmed,
    route: '/history',
    title: 'Meu histórico',
  },
  {
    icon: 'mdi-google-analytics',
    locked: (confirmed) => !confirmed,
    route: '/performance',
    title: 'Performance',
  },
  {
    icon: 'mdi-book-multiple',
    locked: (confirmed) => !confirmed,
    route: '/stats',
    title: 'Dados da Matrícula',
  },
  {
    icon: 'mdi-file-document-multiple',
    locked: (confirmed) => !confirmed,
    permissions: ['admin', 'archives'],
    route: '/archives',
    title: 'Arquivos',
  },
  {
    icon: 'mdi-whatsapp',
    locked: () => false,
    releaseDate: dayjs('07/10/2025'),
    route: '/grupos-whatsapp',
    title: 'Grupos no WhatsApp',
  },
  {
    icon: 'mdi-calendar',
    locked: () => false,
    releaseDate: dayjs('11/25/2023'),
    route: '/calengrade',
    title: 'Calengrade',
  },
  {
    icon: 'mdi-bank',
    locked: () => false,
    route: '/donate',
    title: 'Apoie o UFABC next',
  },
  {
    icon: 'mdi-help-circle',
    locked: () => false,
    route: '/help',
    title: 'Ajuda',
  },
];

export function getExternalNavigationItems({
  apiURL,
  token,
  permissions,
}: {
  apiURL: string;
  token: string | null;
  permissions: string[];
}): ExternalNavItem[] {
  return [
    {
      icon: 'fa-brands fa-discord',
      title: 'Discord',
      url: 'https://discord.gg/7BBzDwRXSg',
    },
    {
      icon: 'mdi-open-in-new',
      title: 'Snapshot da Matrícula',
      url: 'https://ufabc-matricula-snapshot.vercel.app',
    },
    {
      icon: 'mdi-download',
      title: 'Use a Extensão',
      url: 'https://chrome.google.com/webstore/detail/ufabc-next/gphjopenfpnlnffmhhhhdiecgdcopmhk',
    },
    ...(permissions.includes('admin')
      ? [
          {
            icon: 'mdi-open-in-new',
            title: 'Monitoramento de Jobs',
            url: `${apiURL}/board/ui?token=${token}`,
          },
        ]
      : []),
    ...(permissions.includes('admin')
      ? [
          {
            icon: 'mdi-open-in-new',
            title: 'Monitoramento de Jobs V2',
            url: `${apiURL}/v2/board/ui?token=${token}`,
          },
        ]
      : []),
  ];
}
