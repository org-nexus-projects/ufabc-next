// 12H = 1 credit
export function extractCredits(inputString: string) {
  const pattern = /^(\d{1,7})h$/;
  const match = inputString.match(pattern);

  if (!match) {
    return 0;
  }
  const [, hour] = match;
  const credits = Number(hour) / 12;

  return Math.floor(credits);
}
