import { PRODUCTION_MARKETPLACE_HOST_URL } from '@microapp-io/runtime';
import { UserPreferencesData } from './types';
import { PreferencesRepo } from './preferences-repo';

export type PreferencesUpdateCallback = (data?: UserPreferencesData) => void;

export class ProdUserPreferences implements PreferencesRepo {
  preferences?: UserPreferencesData;
  listeners: Set<PreferencesUpdateCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.#setupMessageListener();
      this.#init();
    }
  }

  #setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case '@microapp:userPreferences':
          this.preferences = payload;
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
      PRODUCTION_MARKETPLACE_HOST_URL
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
    return this.preferences || { theme: 'light', lang: 'en-us' };
  }
}
