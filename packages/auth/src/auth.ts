import { invariant } from './utils';
import type { AuthConfigParams } from './auth-config';
import { AuthConfig } from './auth-config';
import type { AuthRepo } from './auth-repo';
import type { User } from './user';
import { HttpAuthRepo } from './http-auth-repo';
import { SandboxAuthRepo } from './sandbox-auth-repo';

export class Auth {
  readonly config: AuthConfig;
  private readonly repo: AuthRepo;
  private user?: User;

  constructor({
    config,
    sandbox,
  }: {
    config?: Partial<AuthConfigParams>;
    sandbox?: boolean;
  } = {}) {
    this.config = new AuthConfig(config);
    this.repo = new HttpAuthRepo(this.config);

    if (sandbox) {
      this.repo = new SandboxAuthRepo();
    }
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
    return this.repo.isAuthenticated();
  }

  async getCachedUser(): Promise<User> {
    if (!this.user) {
      return this.getUser();
    }
    return this.user;
  }

  async getUser(): Promise<User> {
    this.user = await this.repo.getUser();
    return this.user;
  }
}
