import type {
  MicroappMessagePayload,
  MicroappUserPreferencesMessage,
} from '@microapp-io/runtime';

export type UserPreferencesUpdateCallback = (
  preferences: MicroappMessagePayload<MicroappUserPreferencesMessage>
) => void;

export interface UserPreferencesRepo {
  getPreferences(): MicroappMessagePayload<MicroappUserPreferencesMessage> | null;
  onUpdate(callback: UserPreferencesUpdateCallback): () => void;
}
