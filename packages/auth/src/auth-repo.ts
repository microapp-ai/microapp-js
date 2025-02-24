import type { User } from './user';

export type AuthRepoBuildLoginUrlParams = { returnTo?: string };
export type UserAuthenticatedCallback = (user: User | null) => void;
export type UnsubscribeCallback = () => void;

export interface AuthRepo {
  isAuthenticated(): Promise<boolean>;

  getUser(): Promise<User>;

  requestLogin(): void;

  onUserAuthenticated(callback: UserAuthenticatedCallback): UnsubscribeCallback;
}
