export class MicroappAuthError extends Error {
  readonly cause?: any;

  constructor(message: string, { cause }: { cause?: any } = {}) {
    super(message);
    this.cause = cause;
  }
}
