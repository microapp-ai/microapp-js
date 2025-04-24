import type {
  AuthRepo,
  UnsubscribeCallback,
  UserAuthenticatedCallback,
} from './auth-repo';
import type { User } from './user';
import type { SandboxAuthOptions } from './sandbox-auth-repo';
import { SandboxAuthRepo } from './sandbox-auth-repo';
import { invariant } from './utils';
import { MessageBusAuthRepo } from './message-bus-auth-repo';

export type AuthOptions = {
  sandbox?: SandboxAuthOptions;
};

export class Auth {
  private readonly repo: AuthRepo;
  private user?: User;

  constructor({ sandbox }: AuthOptions = {}) {
    this.repo = new MessageBusAuthRepo();

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

  onUserAuthenticated(
    callback: UserAuthenticatedCallback
  ): UnsubscribeCallback {
    return this.repo.onUserAuthenticated(callback);
  }
}
