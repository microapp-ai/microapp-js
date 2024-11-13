export class MicroappConfigError extends Error {
  readonly cause?: any;

  constructor(message: string, options: { cause?: any } = {}) {
    super(message);
    this.cause = options.cause;
  }
}
