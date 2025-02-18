import type { AuthConfigParams } from './auth-config';
import { AuthConfig } from './auth-config';
import type { AuthRepo } from './auth-repo';
import type { User } from './user';
import { HttpAuthRepo } from './http-auth-repo';
import type { SandboxAuthOptions } from './sandbox-auth-repo';
import { SandboxAuthRepo } from './sandbox-auth-repo';
import { invariant } from './utils';

export type AuthOptions = {
  config?: Partial<AuthConfigParams>;
  sandbox?: SandboxAuthOptions;
};

export class Auth {
  readonly config: AuthConfig;
  private readonly repo: AuthRepo;
  private user?: User;

  constructor({ config, sandbox }: AuthOptions = {}) {
    this.config = new AuthConfig(config);
    this.repo = new HttpAuthRepo(this.config);

    const isSandboxEnabled = sandbox
      ? SandboxAuthRepo.isEnabled(sandbox)
      : false;

    if (isSandboxEnabled) {
      this.repo = new SandboxAuthRepo(sandbox!);
    }
  }

  requestLogin(): void {
    invariant(
        typeof window !== 'undefined',
        'requestLogin can only be used in the browser'
    );

    this.repo.requestLogin();
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

  onUserAuthenticated(callback: (user: User) => void): void{
    this.repo.onUserAuthenticated(callback);
  }
}
