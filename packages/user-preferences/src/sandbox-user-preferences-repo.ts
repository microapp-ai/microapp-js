import type {
  UserPreferencesRepo,
  UserPreferencesUpdateCallback,
} from './user-preferences-repo';
import type {
  MicroappLanguage,
  MicroappMessagePayload,
  MicroappTheme,
  MicroappUserPreferencesMessage,
} from '@microapp-io/runtime';
import { DEFAULT_MICROAPP_USER_PREFERENCES } from './constants';

export type SandboxUserPreferencesRepoOptions = {
  theme?: MicroappTheme;
  lang?: MicroappLanguage;
};

export class SandboxUserPreferencesRepo implements UserPreferencesRepo {
  readonly #mockPreferences: MicroappMessagePayload<MicroappUserPreferencesMessage>;
  #listeners: Set<UserPreferencesUpdateCallback> = new Set();

  constructor(options: SandboxUserPreferencesRepoOptions) {
    this.#mockPreferences = Object.assign(
      DEFAULT_MICROAPP_USER_PREFERENCES,
      options
    );

    this.#simulateInitialMessage();
  }

  #simulateInitialMessage() {
    setTimeout(() => {
      this.#listeners.forEach((callback) => callback(this.#mockPreferences));
    }, 100);
  }

  getPreferences(): MicroappMessagePayload<MicroappUserPreferencesMessage> {
    return this.#mockPreferences;
  }

  onUpdate(callback: UserPreferencesUpdateCallback): () => void {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }
}
