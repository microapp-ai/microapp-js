import { UserPreferencesData } from './types';

export interface PreferencesRepo {
  getPreferences(): UserPreferencesData;
  onUpdate(callback: (data?: UserPreferencesData) => void): () => void;
}
