import { PreferencesRepo } from './preferences-repo';
import { SandboxPreferencesOptions, type UserPreferencesData } from './types';

export class SandboxUserPreferences implements PreferencesRepo {
  #mockPreferences: UserPreferencesData;
  #listeners: Set<(data?: UserPreferencesData) => void> = new Set();

  constructor(options: SandboxPreferencesOptions) {
    this.#mockPreferences = options;
    this.#simulateInitialMessage();
  }

  #simulateInitialMessage() {
    setTimeout(() => {
      this.notifyListeners();
    }, 100);
  }

  getPreferences(): UserPreferencesData {
    return this.#mockPreferences || { theme: 'light', lang: 'en-us' };
  }

  onUpdate(callback: (data?: UserPreferencesData) => void): () => void {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  private notifyListeners() {
    this.#listeners.forEach((callback) => callback(this.#mockPreferences));
  }
}
