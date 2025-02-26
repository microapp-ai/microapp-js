import type { MicroappUserPreferencesMessagePayload } from '@microapp-io/runtime';

export type UserPreferencesUpdateCallback = (
  preferences: MicroappUserPreferencesMessagePayload
) => void;

export interface UserPreferencesRepo {
  getPreferences(): MicroappUserPreferencesMessagePayload | null;
  onUpdate(callback: UserPreferencesUpdateCallback): () => void;
}
