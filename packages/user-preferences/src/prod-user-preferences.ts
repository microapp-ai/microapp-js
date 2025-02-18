import { UserPreferencesData } from './types';
import { PreferencesRepo } from './preferences-repo';
import { WindowMessage, WindowPostMessageBus } from '@microapp-io/runtime';
import { DEFAULT_PREFERENCES } from './constants';

export type PreferencesUpdateCallback = (data?: UserPreferencesData) => void;

export class ProdUserPreferences implements PreferencesRepo {
  preferences?: UserPreferencesData;
  listeners: Set<PreferencesUpdateCallback> = new Set();
  #messageBus: WindowPostMessageBus<
    WindowMessage<
      '@microapp:userPreferences',
      { theme?: string; lang?: string }
    >
  >;

  constructor() {
    this.#messageBus = new WindowPostMessageBus();

    if (typeof window !== 'undefined') {
      this.#setupMessageListener();
    }
  }

  #setupMessageListener() {
    console.log('setupMessageListener', { preferences: this.preferences });
    this.#messageBus.on(
      '@microapp:userPreferences',
      (payload: UserPreferencesData) => {
        this.preferences = payload;
        this.notifyListeners();
      }
    );
  }

  onUpdate(callback: PreferencesUpdateCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.preferences));
  }

  getPreferences(): UserPreferencesData {
    return this.preferences || DEFAULT_PREFERENCES;
  }
}
