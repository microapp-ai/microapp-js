import type { AuthRepo } from "./auth-repo";
import type { User } from "./user";
import type { AuthConfig } from "./auth-config";
import { invariant } from "./utils";

export class HttpAuthRepo implements AuthRepo {
  constructor(private config: AuthConfig) {}

  async getUser(): Promise<User> {
    const getUserUrl = this.config.buildUrl({
      path: "/api/auth/me",
    });

    const response = await fetch(getUserUrl);
    invariant(response.status === 200, "Could not get auth user");

    const user = await response.json();
    return {
      id: user.sub,
      email: user.email,
      pictureUrl: user.picture,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getUser();
      return true;
    } catch (error) {
      const isGetUserError =
        error instanceof Error && error.message === "Could not get auth user";

      if (isGetUserError) {
        return false;
      }

      throw error;
    }
  }
}
