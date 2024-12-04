import type { AuthRepo } from './auth-repo';
import type { User } from './user';
import type { AuthRepoStorage } from './auth-repo-storage';
import { SandboxAuthRepoStorage } from './sandbox-auth-repo-storage';
import { NoAuthenticatedUserError } from './errors';

export class SandboxAuthRepo implements AuthRepo {
  private storage: AuthRepoStorage | null = null;

  async getUser(): Promise<User> {
    const storage = this.getOrInitiateStorage();
    const user = storage.getUser();
    if (!user) {
      throw new NoAuthenticatedUserError('Could not get auth user');
    }
    return user;
  }

  private getOrInitiateStorage(): AuthRepoStorage {
    if (!this.storage) {
      this.storage = SandboxAuthRepoStorage.getInstance();
    }
    return this.storage;
  }

  async isAuthenticated(): Promise<boolean> {
    const storage = this.getOrInitiateStorage();
    return storage.getUser() !== null;
  }

  setUser(user: User): void {
    const storage = this.getOrInitiateStorage();
    storage.setUser(user);
  }

  clearUser(): void {
    const storage = this.getOrInitiateStorage();
    storage.clearUser();
  }
}
