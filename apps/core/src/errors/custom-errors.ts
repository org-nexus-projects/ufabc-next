import { NextError } from './next-error.js';

export class StudentNotFoundError extends NextError {
  constructor() {
    super({
      code: 'NEX000001',
      description: 'Student not found',
      status: 404,
      title: 'Student Not Found',
    });
    this.name = 'StudentNotFoundError';
  }
}

export class UserNotFoundError extends NextError {
  constructor() {
    super({
      code: 'NEX000002',
      description: 'User not found',
      status: 404,
      title: 'User Not Found',
    });
    this.name = 'UserNotFoundError';
  }
}

export class RaConflictError extends NextError {
  constructor() {
    super({
      code: 'NEX000003',
      description: 'RA does not match between student and user records',
      status: 409,
      title: 'RA Conflict',
    });
    this.name = 'RaConflictError';
  }
}
