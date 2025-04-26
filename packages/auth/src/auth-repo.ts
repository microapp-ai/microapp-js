import type { User } from './user';

export type UserAuthenticatedCallback = (user: User | null) => void;
export type UnsubscribeCallback = () => void;

export interface AuthRepo {
  isAuthenticated(): Promise<boolean>;

  getUser(): Promise<User | null>;

  requestLogin(): void;

  onUserAuthenticated(callback: UserAuthenticatedCallback): UnsubscribeCallback;
}
