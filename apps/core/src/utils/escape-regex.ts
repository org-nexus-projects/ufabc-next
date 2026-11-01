import { REGEX_SPECIAL_CHARS } from '@/constants.js';

export function escapeRegex(text: string) {
  let escaped = '';
  for (const char of text) {
    if (REGEX_SPECIAL_CHARS.test(char)) {
      escaped += `\\${char}`;
    } else {
      escaped += char;
    }
  }
  return escaped;
}
