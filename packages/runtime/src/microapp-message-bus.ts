import type { WindowMessage } from './window-post-message-bus';
import { WindowPostMessageBus } from './window-post-message-bus';
import type { MicroappLanguage, MicroappTheme } from './types';
import type {
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';

export type MicroappRouteChangeMessagePayload = { url: string };
export type MicroappResizeMessagePayload = {
  widthInPixel: number;
  heightInPixel: number;
};

export type MicroappUserPreferencesMessagePayload = {
  theme?: MicroappTheme;
  lang?: MicroappLanguage;
};

export type MicroappMessageTypes =
  | WindowMessage<
      typeof MICROAPP_ROUTE_CHANGE_EVENT_NAME,
      MicroappRouteChangeMessagePayload
    >
  | WindowMessage<
      typeof MICROAPP_RESIZE_EVENT_NAME,
      MicroappResizeMessagePayload
    >
  | WindowMessage<
      typeof MICROAPP_USER_PREFERENCES_EVENT_NAME,
      { theme?: MicroappTheme; lang?: MicroappLanguage }
    >;

export class MicroappMessageBus extends WindowPostMessageBus<MicroappMessageTypes> {}
