import { UserPreferencesRepo } from './user-preferences-repo';
import { MessageBusUserPreferencesRepo } from './message-bus-user-preferences-repo';
import { SandboxUserPreferencesRepo } from './sandbox-user-preferences-repo';
import { UserPreferencesData, UserPreferencesOptions } from './types';

export class UserPreferences {
  #repo: UserPreferencesRepo;

  constructor(options: UserPreferencesOptions = {}) {
    this.#repo = options.sandbox
      ? new SandboxUserPreferencesRepo(options.sandbox)
      : new MessageBusUserPreferencesRepo();
  }

  getPreferences(): UserPreferencesData {
    return this.#repo.getPreferences();
  }

  onUpdate(callback: (data?: UserPreferencesData) => void): () => void {
    return this.#repo.onUpdate(callback);
  }
}
