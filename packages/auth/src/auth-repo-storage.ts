import type { User } from './user';

export interface AuthRepoStorage {
  getUser(): User | null;
  setUser(user: User): void;
  clearUser(): void;
}
