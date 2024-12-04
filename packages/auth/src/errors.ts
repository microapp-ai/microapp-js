export class MicroappAuthError extends Error {
  readonly cause?: any;

  constructor(message: string, { cause }: { cause?: any } = {}) {
    super(message);
    this.cause = cause;
  }
}

export class NoAuthenticatedUserError extends MicroappAuthError {
  constructor(message: string) {
    super(message);
    this.name = 'NoAuthenticatedUserError';
  }
}

export class InvariantError extends MicroappAuthError {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}
