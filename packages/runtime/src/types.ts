import type { WindowMessage } from './window-post-message-bus';
import type {
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';

export type MicroappLanguage = 'en' | 'es' | 'pt';
export type MicroappTheme = 'light' | 'dark';

export type MicroappRouteChangeMessage = WindowMessage<
  typeof MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  {
    trigger:
      | 'DOMContentLoaded'
      | 'load'
      | 'popstate'
      | 'pushState'
      | 'replaceState'
      | 'polling';
    url: string;
    title: string;
  }
>;

export type MicroappResizeMessage = WindowMessage<
  typeof MICROAPP_RESIZE_EVENT_NAME,
  {
    trigger:
      | 'load'
      | 'resize'
      | 'orientationchange'
      | 'fullscreenchange'
      | 'resizeObserver'
      | 'mutationObserver';
    widthInPixel: number;
    heightInPixel: number;
  }
>;

export type MicroappUserPreferencesMessage = WindowMessage<
  typeof MICROAPP_USER_PREFERENCES_EVENT_NAME,
  { theme: MicroappTheme; lang: MicroappLanguage }
>;

export type MicroappSetViewportSizeMessage = WindowMessage<
  typeof MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME,
  {
    trigger:
      | 'load'
      | 'resize'
      | 'orientationchange'
      | 'fullscreenchange'
      | 'resizeObserver'
      | 'mutationObserver';
    widthInPixel: number;
    heightInPixel: number;
  }
>;

export type MicroappMessages =
  | MicroappRouteChangeMessage
  | MicroappResizeMessage
  | MicroappUserPreferencesMessage
  | MicroappSetViewportSizeMessage;

export type MicroappMessageType<TMessage extends MicroappMessages> =
  TMessage['type'];

export type MicroappMessagePayload<TMessage extends MicroappMessages> =
  TMessage['payload'];
