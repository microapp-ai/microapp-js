import { InvariantError } from './errors';

export function invariant(condition: any, message: string) {
  if (!condition) {
    throw new InvariantError(message);
  }
}

export function warning(condition: any, message: string) {
  if (condition) {
    console.warn(message);
  }
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}
