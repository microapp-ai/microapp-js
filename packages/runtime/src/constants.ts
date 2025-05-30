import type { MicroappLanguage, MicroappTheme } from './types';

export const ALLOWED_MICROAPP_ORIGIN_HOSTNAMES = [
  'microapp.io',
  'www.microapp.io',
  'staging.microapp.io',
  'app.microapp.io',
  'localhost',
];

export const DEFAULT_MICROAPP_THEME: MicroappTheme = 'light';
export const DEFAULT_MICROAPP_LANGUAGE: MicroappLanguage = 'en';

export const MICROAPP_URL_PARAM_NAMES = {
  TARGET_ORIGIN: '__microappTargetOrigin',
  THEME: '__microappTheme',
  LANGUAGE: '__microappLanguage',
};

export const MICROAPP_INIT_EVENT_NAME = '@microapp:init';
export const MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME =
  '@microapp:initAcknowledgement';
export const MICROAPP_ROUTE_CHANGE_EVENT_NAME = '@microapp:routeChange';
export const MICROAPP_POP_STATE_EVENT_NAME = '@microapp:popState';
export const MICROAPP_RESIZE_EVENT_NAME = '@microapp:resize';
export const MICROAPP_USER_PREFERENCES_EVENT_NAME = '@microapp:userPreferences';
export const MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME =
  '@microapp:setViewportSize';
export const MICROAPP_USER_AUTHENTICATED_EVENT_NAME =
  '@microapp:userAuthenticated';
export const MICROAPP_REQUIRE_USER_AUTHENTICATED_EVENT_NAME =
  '@microapp:requireUserAuthenticated';
export const MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME =
  '@microapp:requestUserAuthenticated';
export const MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME =
  '@microapp:userAppSubscription';
export const MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME =
  '@microapp:requireUserAppSubscription';
export const MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME =
  '@microapp:requestUserAppSubscription';
export const MICROAPP_USER_JWT_TOKEN_EVENT_NAME = '@microapp:userJwtToken';
export const MICROAPP_REQUEST_USER_JWT_TOKEN_EVENT_NAME =
  '@microapp:requestUserJwt';

export const DEFAULT_MICROAPP_REQUEST_TIMEOUT_IN_MS = 1000 * 30;
