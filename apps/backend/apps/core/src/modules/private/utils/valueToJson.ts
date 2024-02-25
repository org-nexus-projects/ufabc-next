export function valueToJson(payload: string, max?: number) {
  const parts = payload.split('=');
  if (parts.length < 2) {
    return [];
  }

  const jsonStr = parts[1].split(';')[0];
  const json = JSON.parse(jsonStr) as number[];

  if (max) {
    return json.slice(0, max);
  }
  return json;
}
