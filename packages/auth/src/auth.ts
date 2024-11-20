import { invariant } from './utils';
import type { AuthConfigParams } from './auth-config';
import { AuthConfig } from './auth-config';
import type { AuthRepo } from './auth-repo';
import type { User } from './user';
import { HttpAuthRepo } from './http-auth-repo';

export class Auth {
  readonly config: AuthConfig;
  private readonly authRepo: AuthRepo;
  private user?: User;

  constructor({
    config,
    authRepo,
  }: {
    config?: Partial<AuthConfigParams>;
    authRepo?: AuthRepo;
  } = {}) {
    this.config = new AuthConfig(config);
    this.authRepo = authRepo || new HttpAuthRepo(this.config);
  }

  buildLoginUrl(params?: { returnTo?: string }): string {
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

  requestLogin(): void {
    invariant(
      typeof window !== 'undefined',
      'requestLogin can only be used in the browser'
    );

    const loginUrl = this.buildLoginUrl();
    window.location.href = loginUrl;
  }

  isAuthenticated(): Promise<boolean> {
    return this.authRepo.isAuthenticated();
  }

  async getCachedUser(): Promise<User> {
    if (!this.user) {
      return this.getUser();
    }
    return this.user;
  }

  async getUser(): Promise<User> {
    this.user = await this.authRepo.getUser();
    return this.user;
  }
}
