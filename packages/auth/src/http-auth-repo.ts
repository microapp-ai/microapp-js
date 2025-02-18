import type { AuthRepo, AuthRepoBuildLoginUrlParams } from './auth-repo';
import type { User } from './user';
import type { AuthConfig } from './auth-config';
import { invariant } from './utils';
import { NoAuthenticatedUserError } from './errors';

export class HttpAuthRepo implements AuthRepo {
  private onUserAuthenticatedCallback: (user: User) => void = () => {};

  constructor(private config: AuthConfig) {}

  private buildLoginUrl(params?: AuthRepoBuildLoginUrlParams): string {
    invariant(
      typeof window !== 'undefined',
      'requestLogin can only be used in the browser'
    );

    const returnTo = params?.returnTo || this.buildDefaultReturnTo();

    return this.config.buildUrl({
      path: '/api/auth/login',
      query: {
        returnTo,
      },
    });
  }

  private buildDefaultReturnTo(): string | undefined {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
  }

  async getUser(): Promise<User> {
    const getUserUrl = this.config.buildUrl({
      path: '/api/auth/me',
    });

    const response = await fetch(getUserUrl);
    invariant(response.status === 200, 'Could not get auth user');

    const user = await response.json();

    this.onUserAuthenticatedCallback(user);

    return {
      id: user.sub,
      email: user.email,
      pictureUrl: user.picture,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getUser();
      return true;
    } catch (error) {
      const isGetUserError = error instanceof NoAuthenticatedUserError;

      if (isGetUserError) {
        return false;
      }

      throw error;
    }
  }

  requestLogin(): void {
    invariant(
        typeof window !== 'undefined',
        'requestLogin can only be used in the browser'
    );

    window.location.href = this.buildLoginUrl();
  }

  onUserAuthenticated(callback: (user: User) => void): void {
    this.onUserAuthenticatedCallback = callback;
  }
}
