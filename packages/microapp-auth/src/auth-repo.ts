import type { User } from "./user";

export interface AuthRepo {
  isAuthenticated(): Promise<boolean>;

  getUser(): Promise<User>;
}
