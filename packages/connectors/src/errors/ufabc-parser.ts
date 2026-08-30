export class UfabcParserError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly title: string;
  public readonly description: string;
  public readonly additionalData?: Record<string, any>;

  constructor(payload: {
    title: string;
    code: string;
    status: number;
    description: string;
    additionalData?: Record<string, any>;
  }) {
    super(payload.description);
    this.name = 'UfabcParserError';
    this.status = payload.status;
    this.code = payload.code;
    this.title = payload.title;
    this.description = payload.description;
    this.additionalData = payload.additionalData;
  }
}
