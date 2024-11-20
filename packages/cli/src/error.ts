export class MicroappCLIError extends Error {
  readonly cause?: any;

  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message);
    this.cause = options.cause;
  }
}
