export class NextError extends Error {
  public readonly code: string;
  public readonly title: string;
  public readonly description: string;
  public readonly status: number;
  public readonly additionalData?: Record<string, unknown>;

  constructor(payload: {
    title: string;
    description: string;
    status: number;
    code: string;
    additionalData?: Record<string, unknown>;
  }) {
    super(payload.description);
    this.name = 'NextError';
    this.title = payload.title;
    this.description = payload.description;
    this.status = payload.status;
    this.code = payload.code;
    this.additionalData = payload.additionalData;
  }
}
