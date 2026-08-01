export class BaseConnectorError extends Error {
  public readonly title: string;
  public readonly code: string;
  public readonly httpStatus: number | undefined;
  public readonly description: string;
  public readonly additionalData: Record<string, unknown> | undefined;

  constructor(
    title: string,
    code: string,
    httpStatus: number | undefined,
    description: string,
    additionalData?: Record<string, unknown>
  ) {
    super(title);
    this.name = 'BaseConnectorError';
    this.title = title;
    this.code = code;
    this.httpStatus = httpStatus;
    this.description = description;
    this.additionalData = additionalData;
  }
}
