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
    this.#preferences = this.#getInitialPreferences();
    this.#setupMessageListener();
  }

  #getInitialPreferences(): MicroappMessagePayload<MicroappUserPreferencesMessage> {
    const getPreferences: Array<
      () => MicroappMessagePayload<MicroappUserPreferencesMessage> | undefined
    > = [
      () => {
        if (
          typeof window !== 'undefined' &&
          '__MICROAPP__' in window &&
          typeof window.__MICROAPP__ === 'object' &&
          window.__MICROAPP__ !== null &&
          'theme' in window.__MICROAPP__ &&
          typeof window.__MICROAPP__.theme === 'string' &&
          'lang' in window.__MICROAPP__ &&
          typeof window.__MICROAPP__.lang === 'string'
        ) {
          console.info(
            '[@microapp-io/user-preferences] Using preferences from window.__MICROAPP__',
            window.__MICROAPP__
          );
          return {
            theme: window.__MICROAPP__.theme,
            lang: window.__MICROAPP__.lang,
          } as MicroappMessagePayload<MicroappUserPreferencesMessage>;
        }
      },
      () => {
        if (typeof window === 'undefined') {
          return;
        }

        const preferences = buildUserPreferencesFromMicroappUrl(
          window.location.href
        );

        if (preferences) {
          console.info(
            '[@microapp-io/user-preferences] Using preferences from microapp URL',
            preferences
          );
          return preferences;
        }
      },
      () => {
        console.info(
          '[@microapp-io/user-preferences] Using default preferences',
          DEFAULT_MICROAPP_USER_PREFERENCES
        );
        return DEFAULT_MICROAPP_USER_PREFERENCES;
      },
    ];

    for (const getPreference of getPreferences) {
      const preferences = getPreference();
      if (preferences) {
        return preferences;
      }
    }

    throw new Error(
      '[@microapp-io/user-preferences] Could not get initial preferences'
    );
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
