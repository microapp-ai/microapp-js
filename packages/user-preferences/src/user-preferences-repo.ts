import { UserPreferencesData } from './types';

export interface UserPreferencesRepo {
  getPreferences(): UserPreferencesData;
  onUpdate(callback: (data?: UserPreferencesData) => void): () => void;
}
