import {
  DEFAULT_MICROAPP_LANGUAGE,
  DEFAULT_MICROAPP_THEME,
  type MicroappMessagePayload,
  type MicroappUserPreferencesMessage,
} from '@microapp-io/runtime';

export const DEFAULT_MICROAPP_USER_PREFERENCES: MicroappMessagePayload<MicroappUserPreferencesMessage> =
  {
    theme: DEFAULT_MICROAPP_THEME,
    lang: DEFAULT_MICROAPP_LANGUAGE,
  };
