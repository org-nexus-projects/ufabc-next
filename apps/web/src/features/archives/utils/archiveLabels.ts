import type { ArchiveSource, ArchiveStatus } from '@next/services';

export const sourceLabels: Record<ArchiveSource, string> = {
  cmcc: 'CMCC',
  manual: 'Manual',
  moodle: 'Moodle',
  sigaa: 'SIGAA',
};

export const shiftLabels = {
  day: 'Diurno',
  night: 'Noturno',
} as const;

export const statusLabels: Record<ArchiveStatus, string> = {
  created: 'Aguardando',
  deleted: 'Removido',
  downloaded: 'Baixado',
  failed: 'Falhou',
  stored: 'Armazenado',
};

export const statusDotClass: Record<ArchiveStatus, string> = {
  created: 'bg-ufabcnext-yellow',
  deleted: 'bg-next-light-gray',
  downloaded: 'bg-primary',
  failed: 'bg-error',
  stored: 'bg-ufabcnext-green',
};

export function buildSelectOptions(labels: Record<string, string>) {
  const options = [];
  for (const value of Object.keys(labels)) {
    options.push({ title: labels[value], value });
  }
  return options;
}
