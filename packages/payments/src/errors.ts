export class MicroappPaymentsError extends Error {
  readonly cause?: any;

  constructor(message: string, { cause }: { cause?: any } = {}) {
    super(message);
    this.cause = cause;
  }
}

export class NoSubscriptionError extends MicroappPaymentsError {
  constructor(message: string) {
    super(message);
    this.name = 'NoSubscriptionError';
  }
}

export class InvariantError extends NoSubscriptionError {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}