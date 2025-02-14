import { PreferencesRepo } from './preferences-repo';
import { ProdUserPreferences } from './prod-user-preferences';
import { SandboxUserPreferences } from './sandbox-user-preferences';
import { UserPreferencesData, UserPreferencesOptions } from './types';

export class UserPreferences {
  #repo: PreferencesRepo;

  constructor(options: UserPreferencesOptions = {}) {
    this.#repo = options.sandbox
      ? new SandboxUserPreferences(options.sandbox)
      : new ProdUserPreferences();
  }

  getPreferences(): UserPreferencesData {
    return this.#repo.getPreferences();
  }

  onUpdate(callback: (data?: UserPreferencesData) => void): () => void {
    return this.#repo.onUpdate(callback);
  }
}
