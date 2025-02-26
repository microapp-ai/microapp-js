import type { MicroappLanguage, MicroappTheme } from './types';

export const ALLOWED_MICROAPP_ORIGIN_HOSTNAMES = [
  'microapp.io',
  'www.microapp.io',
  'staging.microapp.io',
  'localhost',
];

export const DEFAULT_MICROAPP_THEME: MicroappTheme = 'light';
export const DEFAULT_MICROAPP_LANGUAGE: MicroappLanguage = 'en';

export const MICROAPP_URL_PARAM_NAMES = {
  TARGET_ORIGIN: '__microappTargetOrigin',
  THEME: '__microappTheme',
  LANGUAGE: '__microappLanguage',
};

export const MICROAPP_ROUTE_CHANGE_EVENT_NAME = '@microapp:routeChange';
export const MICROAPP_POP_STATE_EVENT_NAME = '@microapp:popState';
export const MICROAPP_RESIZE_EVENT_NAME = '@microapp:resize';
export const MICROAPP_USER_PREFERENCES_EVENT_NAME = '@microapp:userPreferences';
