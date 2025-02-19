import { UserPreferencesRepo } from './user-preferences-repo';
import { ProductionUserPreferencesRepo } from './prod-user-preferences';
import { SandboxUserPreferences } from './sandbox-user-preferences';
import { UserPreferencesData, UserPreferencesOptions } from './types';

export class UserPreferences {
  #repo: UserPreferencesRepo;

  constructor(options: UserPreferencesOptions = {}) {
    this.#repo = options.sandbox
      ? new SandboxUserPreferences(options.sandbox)
      : new ProductionUserPreferencesRepo();
  }

  getPreferences(): UserPreferencesData {
    return this.#repo.getPreferences();
  }

  onUpdate(callback: (data?: UserPreferencesData) => void): () => void {
    return this.#repo.onUpdate(callback);
  }
}
