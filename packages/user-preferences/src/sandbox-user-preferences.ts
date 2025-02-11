import { UserPreferences, type UserPreferencesData } from './user-preferences';
export type SandboxPreferencesOptions =
  | boolean
  | {
      enabled?: boolean;
      preferences: UserPreferencesData | (() => UserPreferencesData);
    };
export class SandboxUserPreferences extends UserPreferences {
  #enabled: boolean;
  #mockPreferences: UserPreferencesData;

  static parseOptions(options: SandboxPreferencesOptions): {
    enabled: boolean;
    preferences: UserPreferencesData;
  } {
    if (typeof options === 'boolean') {
      return { enabled: options, preferences: {} };
    }
    const { enabled = true, preferences } = options;
    return {
      enabled,
      preferences:
        typeof preferences === 'function' ? preferences() : preferences,
    };
  }

  static isEnabled(options?: SandboxPreferencesOptions): boolean {
    return options
      ? SandboxUserPreferences.parseOptions(options).enabled
      : false;
  }

  constructor(options: SandboxPreferencesOptions) {
    super();
    const { enabled, preferences } =
      SandboxUserPreferences.parseOptions(options);
    this.#enabled = enabled;
    this.#mockPreferences = preferences;
    if (!this.#enabled) {
      throw new Error('SandboxUserPreferences is disabled.');
    }
    this.#simulatePreferencesUpdate();
  }

  #simulatePreferencesUpdate() {
    setTimeout(() => {
      this.preferences = this.#mockPreferences;
      this.notifyListeners();
    }, 100);
  }

  #throwIfNotEnabled() {
    if (!this.#enabled) {
      throw new Error('Sandbox user preferences are not enabled.');
    }
  }

  override getPreferences(): UserPreferencesData {
    this.#throwIfNotEnabled();
    return this.#mockPreferences || { theme: 'light', lang: 'en-us' };
  }

  updatePreferences(newPreferences: Partial<UserPreferencesData>) {
    this.#throwIfNotEnabled();
    this.#mockPreferences = { ...this.#mockPreferences, ...newPreferences };
    this.preferences = this.#mockPreferences;
    this.notifyListeners();
  }
}
