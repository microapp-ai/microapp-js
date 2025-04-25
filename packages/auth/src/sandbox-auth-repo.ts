import type {
  AuthRepo,
  UnsubscribeCallback,
  UserAuthenticatedCallback,
} from './auth-repo';
import type { User } from './user';
import { NoAuthenticatedUserError } from './errors';
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
  private onUserAuthenticatedCallback: UserAuthenticatedCallback | null = null;
  private authenticatedUser: User | null = null;

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
      getUser: async () => {
        if (typeof user === 'function') {
          return user();
        }
        return user;
      },
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

  async getUser(): Promise<User> {
    this.throwIfNotEnabled();
    await this.requestLogin();
    if (this.authenticatedUser === null) {
      throw new NoAuthenticatedUserError('Could not get auth user');
    }
    return this.authenticatedUser;
  }

  private throwIfNotEnabled(): void {
    invariant(this.enabled, 'Sandbox auth is not enabled');
  }

  async isAuthenticated(): Promise<boolean> {
    this.throwIfNotEnabled();
    return this.authenticatedUser !== null;
  }

  async requestLogin(): Promise<void> {
    this.authenticatedUser = await this._getUser();
    this.onUserAuthenticatedCallback?.(this.authenticatedUser);
  }

  onUserAuthenticated(
    callback: UserAuthenticatedCallback
  ): UnsubscribeCallback {
    this.onUserAuthenticatedCallback = callback;
    return () => {
      this.onUserAuthenticatedCallback = null;
    };
  }
}
