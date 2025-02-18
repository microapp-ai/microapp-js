import type { AuthRepo } from './auth-repo';
import type { User } from './user';
import { NoAuthenticatedUserError } from './errors';
import { invariant, isProduction, warning } from './utils';

export type SandboxAuthOptions =
  | boolean
  | {
      enabled?: boolean;
      user: User | null | (() => User | null) | (() => Promise<User | null>);
      autologin?: boolean;
    };

export class SandboxAuthRepo implements AuthRepo {
  private readonly enabled: boolean;
  private readonly _getUser: () => Promise<User | null>;
  private onUserAuthenticatedCallback: (user: User) => void = () => {};
  private authenticatedUser: User | null = null;

  static parseOptions(options: SandboxAuthOptions): {
    enabled: boolean;
    getUser: () => Promise<User | null>;
    autologin: boolean;
  } {
    if (typeof options === 'boolean') {
      return { enabled: options, getUser: async () => null, autologin: false };
    }

    const { enabled = true, user } = options;
    return {
      enabled,
      getUser:
        typeof user === 'function' ? async () => user() : async () => user,
      autologin: options.autologin ?? false,
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
    const { enabled, getUser, autologin } = SandboxAuthRepo.parseOptions(options);
    this.enabled = enabled;
    this._getUser = getUser;
    if(autologin) {
      this.requestLogin()
    }

    warning(
      isProduction() && enabled,
      '[@microapp-io/auth] Sandbox auth should not be used in production.\nCheck the documentation for more information: https://docs.microapp.io/authentication/introduction'
    );
  }

  async getUser(): Promise<User> {
    this.throwIfNotEnabled();
    if(this.authenticatedUser == null) {
      throw new NoAuthenticatedUserError('Sandbox user not authenticated');
    }

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
    if(this.authenticatedUser == null) {
      return false;
    }
    const user = await this.getUser();
    return user !== null;
  }

  async requestLogin(): Promise<void> {
    this.authenticatedUser = await this._getUser()
    if (this.authenticatedUser) {
      this.onUserAuthenticatedCallback(this.authenticatedUser)
    }
  }

  onUserAuthenticated(callback: (user: User) => void): void {
    this.onUserAuthenticatedCallback = callback;
  }
}
