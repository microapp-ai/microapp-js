import type { MicroappUserPreferencesMessagePayload } from '@microapp-io/runtime';
import {
  DEFAULT_MICROAPP_LANGUAGE,
  DEFAULT_MICROAPP_THEME,
} from '@microapp-io/runtime';

export const DEFAULT_MICROAPP_USER_PREFERENCES: MicroappUserPreferencesMessagePayload =
  {
    theme: DEFAULT_MICROAPP_THEME,
    lang: DEFAULT_MICROAPP_LANGUAGE,
  };
