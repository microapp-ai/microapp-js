import { MicroappCLIError } from '../error';

export class CannotUpdateNextConfigFileError extends MicroappCLIError {
  constructor({ cause }: { cause: unknown }) {
    super('Cannot update next.config.js file', { cause });
  }
}
