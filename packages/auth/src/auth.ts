import type {
  AuthRepo,
  UnsubscribeCallback,
  UserAuthenticatedCallback,
} from './auth-repo';
import type { User } from './user';
import type { SandboxAuthOptions } from './sandbox-auth-repo';
import { SandboxAuthRepo } from './sandbox-auth-repo';
import { MessageBusAuthRepo } from './message-bus-auth-repo';

export type AuthOptions = {
  sandbox?: SandboxAuthOptions;
};

export class Auth {
  private readonly repo: AuthRepo;

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
    this.repo.requestLogin();
  }

  isAuthenticated(): Promise<boolean> {
    return this.repo.isAuthenticated();
  }

  async getUser(): Promise<User | null> {
    return this.repo.getUser();
  }

  onUserAuthenticated(
    callback: UserAuthenticatedCallback
  ): UnsubscribeCallback {
    return this.repo.onUserAuthenticated(callback);
  }
}
