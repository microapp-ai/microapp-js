import type { User } from './user';

export type AuthRepoBuildLoginUrlParams = { returnTo?: string };

export interface AuthRepo {
  isAuthenticated(): Promise<boolean>;

  getUser(): Promise<User>;

  requestLogin(): void;

  onUserAuthenticated(callback: (user: User) => void): void;
}
