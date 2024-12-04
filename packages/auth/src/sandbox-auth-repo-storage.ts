import type { User } from './user';
import { isProduction, warning } from './utils';
import type { AuthRepoStorage } from './auth-repo-storage';

export class SandboxAuthRepoStorage implements AuthRepoStorage {
  private static instance: SandboxAuthRepoStorage;
  private user: User | null = null;

  private constructor() {
    warning(
      isProduction(),
      'MockAuthRepoStorage should not be used in production.\nCheck the documentation for more information: https://docs.microapp.io/authentication/introduction'
    );
  }

  static getInstance(): SandboxAuthRepoStorage {
    if (!SandboxAuthRepoStorage.instance) {
      SandboxAuthRepoStorage.instance = new SandboxAuthRepoStorage();
    }
    return SandboxAuthRepoStorage.instance;
  }

  setUser(user: User): void {
    this.user = user;
  }

  clearUser(): void {
    this.user = null;
  }

  getUser(): User | null {
    return this.user;
  }
}
