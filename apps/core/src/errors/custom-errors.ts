import { NextError } from './base-error.js';

export class EmailVerificationFailed extends NextError {
  constructor(description = 'Unable to verify user email') {
    super('Email Verification Failed', 'NEX0001', 400, description);
  }
}

export class UserWithoutRA extends NextError {
  constructor() {
    super(
      'User Without RA',
      'NEX0002',
      403,
      'User does not have an RA registered'
    );
  }
}

export class ArchiveParseFailed extends NextError {
  constructor(description: string) {
    super('Archive Parse Failed', 'NEX0003', 400, description);
  }
}
