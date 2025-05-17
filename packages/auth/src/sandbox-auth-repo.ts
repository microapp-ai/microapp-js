import type {
  AuthRepo,
  UnsubscribeCallback,
  UserAuthenticatedCallback,
} from './auth-repo';
import type { User } from './user';
import { invariant, isProduction, warning } from './utils';

export type SandboxAuthOptions =
  | boolean
  | {
      enabled?: boolean;
      user: User | null | (() => User | null) | (() => Promise<User | null>);
      userJwtToken?: string | (() => string | null);
    };

export class SandboxAuthRepo implements AuthRepo {
  private readonly enabled: boolean;
  private readonly _getUser: () => Promise<User | null>;
  private readonly _getUserJwtToken: () => Promise<string | null>;
  private onUserAuthenticatedCallback: UserAuthenticatedCallback | null = null;
  private authenticatedUser: User | null = null;

  static parseOptions(options: SandboxAuthOptions): {
    enabled: boolean;
    getUser: () => Promise<User | null>;
    getUserJwtToken: () => Promise<string | null>;
  } {
    if (typeof options === 'boolean') {
      return {
        enabled: options,
        getUser: async () => null,
        getUserJwtToken: async () => null,
      };
    }

    const { enabled = true, user, userJwtToken } = options;
    return {
      enabled,
      getUser: async () => {
        if (typeof user === 'function') {
          return user();
        }
        return user;
      },
      getUserJwtToken: async () => {
        if (typeof userJwtToken === 'function') {
          return userJwtToken();
        }
        return userJwtToken ?? null;
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
    const { enabled, getUser, getUserJwtToken } =
      SandboxAuthRepo.parseOptions(options);
    this.enabled = enabled;
    this._getUser = getUser;
    this._getUserJwtToken = getUserJwtToken;

    warning(
      isProduction() && enabled,
      '[@microapp-io/auth] Sandbox auth should not be used in production.\nCheck the documentation for more information: https://docs.microapp.io/authentication/introduction'
    );
  }

  async getUser(): Promise<User | null> {
    this.throwIfNotEnabled();
    await this.requestLogin();
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

  getUserJwtToken(): Promise<string | null> {
    this.throwIfNotEnabled();
    return this._getUserJwtToken();
  }
}
