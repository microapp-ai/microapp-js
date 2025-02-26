import type { MicroappUserPreferencesMessagePayload } from '@microapp-io/runtime';
import {
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
  MicroappMessageBus,
  MicroappRuntime,
} from '@microapp-io/runtime';
import type {
  UserPreferencesRepo,
  UserPreferencesUpdateCallback,
} from './user-preferences-repo';
import { DEFAULT_MICROAPP_USER_PREFERENCES } from './constants';

export class MessageBusUserPreferencesRepo implements UserPreferencesRepo {
  #preferences: MicroappUserPreferencesMessagePayload | null = null;
  #listeners: Set<UserPreferencesUpdateCallback> = new Set();
  #messageBus: MicroappMessageBus;

  constructor() {
    this.#messageBus = new MicroappMessageBus();

    if (typeof window !== 'undefined') {
      this.#preferences = Object.assign(
        {},
        DEFAULT_MICROAPP_USER_PREFERENCES,
        MicroappRuntime.getUserPreferencesFromIframeSrc(window.location.href)
      );

      this.#setupMessageListener();
    }
  }

  #setupMessageListener() {
    this.#messageBus.on(
      MICROAPP_USER_PREFERENCES_EVENT_NAME,
      (preferences: MicroappUserPreferencesMessagePayload) => {
        this.#preferences = preferences;
        this.#listeners.forEach((callback) => callback(preferences));
      }
    );
  }

  onUpdate(callback: UserPreferencesUpdateCallback): () => void {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  getPreferences(): MicroappUserPreferencesMessagePayload | null {
    return this.#preferences;
  }
}
