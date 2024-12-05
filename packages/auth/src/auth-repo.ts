import type { User } from './user';

export type AuthRepoBuildLoginUrlParams = { returnTo?: string };

export interface AuthRepo {
  buildLoginUrl(params?: AuthRepoBuildLoginUrlParams): string;

  isAuthenticated(): Promise<boolean>;

  getUser(): Promise<User>;
}
