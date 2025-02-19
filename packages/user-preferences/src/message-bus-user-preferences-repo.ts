import { MicroappMessageBus } from '@microapp-io/runtime';
import { UserPreferencesData } from './types';
import { UserPreferencesRepo } from './user-preferences-repo';
import { DEFAULT_PREFERENCES } from './constants';

export type PreferencesUpdateCallback = (data?: UserPreferencesData) => void;

export class MessageBusUserPreferencesRepo implements UserPreferencesRepo {
  preferences?: UserPreferencesData;
  listeners: Set<PreferencesUpdateCallback> = new Set();
  #messageBus: MicroappMessageBus;

  constructor() {
    this.#messageBus = new MicroappMessageBus();

    if (typeof window !== 'undefined') {
      this.#setupMessageListener();
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
