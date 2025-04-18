import type { WindowMessage } from './window-post-message-bus';
import type {
  MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME,
  MICROAPP_INIT_EVENT_NAME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';

export type MicroappLanguage = 'en' | 'es' | 'pt';
export type MicroappTheme = 'light' | 'dark';

export type MicroappInitMessage = WindowMessage<
  typeof MICROAPP_INIT_EVENT_NAME,
  {
    url: string;
    title: string;
  }
>;

export type MicroappInitAcknowledgementMessage = WindowMessage<
  typeof MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME,
  {
    id: string;
    theme: MicroappTheme;
    lang: MicroappLanguage;
  }
>;

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
  | MicroappInitMessage
  | MicroappInitAcknowledgementMessage
  | MicroappRouteChangeMessage
  | MicroappResizeMessage
  | MicroappUserPreferencesMessage
  | MicroappSetViewportSizeMessage;

export type MicroappMessageType<TMessage extends MicroappMessages> =
  TMessage['type'];

export type MicroappMessagePayload<TMessage extends MicroappMessages> =
  TMessage['payload'];

export type WindowMicroapp = {
  id: string;
  hasRouting: boolean;
  hasResizing: boolean;
  hasParentAcknowledgedInit: boolean;
  theme: MicroappTheme | null;
  lang: MicroappLanguage | null;
};
