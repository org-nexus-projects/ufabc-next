import { NextError } from './next-error.js';

export class UfabcParserError extends NextError {
  constructor(payload: {
    title: string;
    code: string;
    status: number;
    description: string;
    additionalData?: Record<string, unknown>;
  }) {
    super(payload);
    this.name = 'UfabcParserError';
  }
}
