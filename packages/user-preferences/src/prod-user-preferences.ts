import { UserPreferencesData } from './types';
import { PreferencesRepo } from './preferences-repo';
import { WindowPostMessageBus } from '@microapp-io/runtime';
import { DEFAULT_PREFERENCES } from './constants';

export type PreferencesUpdateCallback = (data?: UserPreferencesData) => void;

export class ProdUserPreferences implements PreferencesRepo {
  preferences?: UserPreferencesData;
  listeners: Set<PreferencesUpdateCallback> = new Set();
  #messageBus: WindowPostMessageBus;

  constructor() {
    this.#messageBus = new WindowPostMessageBus();

    if (typeof window !== 'undefined') {
      this.#setupMessageListener();
      this.#init();
    }
  }

  #setupMessageListener() {
    this.#messageBus.on(
      '@microapp:userPreferences',
      (payload: UserPreferencesData) => {
        this.preferences = payload;
        this.notifyListeners();
      }
    );
  }

  #init() {
    this.#messageBus.sendUserPreferences({});
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
