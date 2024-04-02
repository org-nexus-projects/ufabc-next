export function parseResponseToJson(response: string, max?: number) {
  const [, value] = response.split('=');
  if (!value) {
    return [];
  }

  const [rawJson] = value.split(';');

  if (!rawJson) {
    throw new Error('Could not get value');
  }

  const json = JSON.parse(rawJson);

  if (max) {
    return json.slice(0, max);
  }

  return json;
}
