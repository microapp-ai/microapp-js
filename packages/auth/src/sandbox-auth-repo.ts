import type { AuthRepo } from './auth-repo';
import type { User } from './user';
import { InvariantError, NoAuthenticatedUserError } from './errors';
import { invariant, isProduction, warning } from './utils';

export type SandboxAuthOptions =
  | boolean
  | {
      enabled?: boolean;
      user: User | null | (() => User | null) | (() => Promise<User | null>);
    };

export class SandboxAuthRepo implements AuthRepo {
  private readonly enabled: boolean;
  private readonly _getUser: () => Promise<User | null>;

  static parseOptions(options: SandboxAuthOptions): {
    enabled: boolean;
    getUser: () => Promise<User | null>;
  } {
    if (typeof options === 'boolean') {
      return { enabled: options, getUser: async () => null };
    }

    const { enabled = true, user } = options;
    return {
      enabled,
      getUser:
        typeof user === 'function' ? async () => user() : async () => user,
    };
  }

  static isEnabled(options?: SandboxAuthOptions): boolean {
    if (!options) {
      return false;
    }

    const { enabled } = SandboxAuthRepo.parseOptions(options);
    return enabled;
  }

  constructor(options: SandboxAuthOptions) {
    const { enabled, getUser } = SandboxAuthRepo.parseOptions(options);
    this.enabled = enabled;
    this._getUser = getUser;

    warning(
      isProduction() && enabled,
      '[@microapp-io/auth] Sandbox auth should not be used in production.\nCheck the documentation for more information: https://docs.microapp.io/authentication/introduction'
    );
  }

  buildLoginUrl(): string {
    throw new InvariantError('Sandbox auth does not support login');
  }

  async getUser(): Promise<User> {
    this.throwIfNotEnabled();
    const user = await this._getUser();
    if (!user) {
      throw new NoAuthenticatedUserError('Could not get sandbox user');
    }
    return user;
  }

  private throwIfNotEnabled(): void {
    invariant(this.enabled, 'Sandbox auth is not enabled');
  }

  async isAuthenticated(): Promise<boolean> {
    this.throwIfNotEnabled();
    const user = await this.getUser();
    return user !== null;
  }
}
