const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/gu;

export function formatScheduleDate(date: string) {
  const parts = ISO_DATE_PATTERN.exec(date);
  if (!parts) {
    return date;
  }
  return `${parts[3]}/${parts[2]}`;
}

export function cleanFileName(fileName: string) {
  return fileName.replace(CONTROL_CHARACTERS, ' ').replace(/\s+/gu, ' ').trim();
}
