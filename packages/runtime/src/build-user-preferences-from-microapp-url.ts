import type {
  MicroappLanguage,
  MicroappMessagePayload,
  MicroappTheme,
  MicroappUserPreferencesMessage,
} from './types';
import { MICROAPP_URL_PARAM_NAMES } from './constants';

export const buildUserPreferencesFromMicroappUrl = (
  iframeSrc: string
): MicroappMessagePayload<MicroappUserPreferencesMessage> => {
  const urlSearchParams = new URLSearchParams(iframeSrc);
  const theme = (urlSearchParams.get(MICROAPP_URL_PARAM_NAMES.THEME) ??
    undefined) as MicroappTheme | undefined;
  const lang = (urlSearchParams.get(MICROAPP_URL_PARAM_NAMES.LANGUAGE) ??
    undefined) as MicroappLanguage | undefined;

  return { theme, lang };
};
