import { MicroappAuthError } from './error';

export function invariant(condition: any, message: string) {
  if (!condition) {
    throw new InvariantError(message);
  }
}

export class InvariantError extends MicroappAuthError {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}
