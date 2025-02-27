import {
  buildUserPreferencesFromMicroappUrl,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
  MicroappMessageBus,
  type MicroappMessagePayload,
  type MicroappUserPreferencesMessage,
} from '@microapp-io/runtime';
import type {
  UserPreferencesRepo,
  UserPreferencesUpdateCallback,
} from './user-preferences-repo';
import { DEFAULT_MICROAPP_USER_PREFERENCES } from './constants';

export class MessageBusUserPreferencesRepo implements UserPreferencesRepo {
  #preferences: MicroappMessagePayload<MicroappUserPreferencesMessage> | null =
    null;
  #listeners: Set<UserPreferencesUpdateCallback> = new Set();
  #messageBus: MicroappMessageBus;

  constructor() {
    this.#messageBus = new MicroappMessageBus();

    if (typeof window !== 'undefined') {
      this.#preferences = Object.assign(
        {},
        DEFAULT_MICROAPP_USER_PREFERENCES,
        buildUserPreferencesFromMicroappUrl(window.location.href)
      );

      this.#setupMessageListener();
    }
  }

  #setupMessageListener() {
    this.#messageBus.on(
      MICROAPP_USER_PREFERENCES_EVENT_NAME,
      (preferences: MicroappMessagePayload<MicroappUserPreferencesMessage>) => {
        this.#preferences = preferences;
        this.#listeners.forEach((callback) => callback(preferences));
      }
    );
  }

  onUpdate(callback: UserPreferencesUpdateCallback): () => void {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  getPreferences(): MicroappMessagePayload<MicroappUserPreferencesMessage> | null {
    return this.#preferences;
  }
}
