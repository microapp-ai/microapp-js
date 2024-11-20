import { MicroappConfigError } from '../error';

export class InvalidConfigError extends MicroappConfigError {}

export class CannotDetermineFrameworkError extends MicroappConfigError {}

export class UnsupportedFrameworkError extends MicroappConfigError {}
