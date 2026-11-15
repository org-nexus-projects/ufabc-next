const ISO_DATE_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;
// oxlint-disable-next-line no-control-regex -- strips ASCII control characters from file names
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/gu;

export function formatScheduleDate(date: string) {
  const parts = ISO_DATE_PATTERN.exec(date);
  if (!parts) {
    return date;
  }
  return `${parts[3]}/${parts[2]}`;
}

export function cleanFileName(fileName: string) {
  return fileName
    .replaceAll(CONTROL_CHARACTERS, ' ')
    .replaceAll(/\s+/gu, ' ')
    .trim();
}
