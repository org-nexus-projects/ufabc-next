export function formatLeadPhone(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.slice(0, 2) === '55') digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (!digits) return '';
  if (digits.length < 2) return '(' + digits;
  var ddd = '(' + digits.slice(0, 2) + ')';
  var number = digits.slice(2);
  if (!number) return ddd;
  var split = number.length > 8 ? 5 : 4;
  return ddd + ' ' + number.slice(0, split) + (number.length > split ? '-' + number.slice(split) : '');
}

export function normalizeLeadPhone(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.slice(0, 2) === '55') digits = digits.slice(2);
  return /^[1-9][0-9](?:9[0-9]{8}|[2-5][0-9]{7})$/.test(digits) ? '55' + digits : '';
}
