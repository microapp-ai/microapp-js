// import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

export type UserPreferencesData = {
  theme?: string;
  lang?: string;
};

export type PreferencesUpdateCallback = (data?: UserPreferencesData) => void;

export class UserPreferences {
  preferences?: UserPreferencesData;
  listeners: Set<PreferencesUpdateCallback> = new Set();

  constructor() {
    this.#setupMessageListener();
    this.#init();
  }

  #setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case '@microapp:userPreferences':
          this.preferences = payload;
          console.log({ payload });
          this.notifyListeners();
          break;

        default:
          break;
      }
    });
  }

  #init() {
    window.parent.postMessage(
      { type: '@microapp:userPreferences' },
      // PRODUCTION_MARKETPLACE_HOST_URL
      '*'
    );
  }

  onUpdate(callback: PreferencesUpdateCallback): () => void {
    this.listeners.add(callback);

    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.preferences));
  }

  getPreferences() {
    return this.preferences;
  }
}
