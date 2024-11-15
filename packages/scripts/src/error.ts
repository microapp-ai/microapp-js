export class MicroappConfigError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.cause = options.cause;
  }
}
