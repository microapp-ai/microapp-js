import { UserPreferencesData } from './types';
import { PreferencesRepo } from './preferences-repo';
import { MessageBus } from '@microapp-io/runtime';

export type PreferencesUpdateCallback = (data?: UserPreferencesData) => void;

export class ProdUserPreferences implements PreferencesRepo {
  preferences?: UserPreferencesData;
  listeners: Set<PreferencesUpdateCallback> = new Set();
  #messageBus: MessageBus;

  constructor() {
    this.#messageBus = new MessageBus();

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
    this.#messageBus.send({
      type: '@microapp:userPreferences',
      payload: {},
    });
  }

  onUpdate(callback: PreferencesUpdateCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.preferences));
  }

  getPreferences(): UserPreferencesData {
    return this.preferences || { theme: 'light', lang: 'en-us' };
  }
}
