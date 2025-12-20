/** biome-ignore lint/complexity/noStaticOnlyClass: Means nothing here */
export class Security {
  static readonly SENSITIVE_HEADERS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'api-key',
  ]);

  static redactHeaders(
    headers: Record<string, string | undefined>,
  ): Record<string, string> {
    const redacted: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (Security.SENSITIVE_HEADERS.has(lowerKey)) {
        redacted[key] = '***';
      } else {
        redacted[key] = value ?? '';
      }
    }
    return redacted;
  }
}
