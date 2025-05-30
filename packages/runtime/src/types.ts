import type { WindowMessage } from './window-post-message-bus';
import type {
  MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME,
  MICROAPP_INIT_EVENT_NAME,
  MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_REQUEST_USER_JWT_TOKEN_EVENT_NAME,
  MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_REQUIRE_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME,
  MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_USER_JWT_TOKEN_EVENT_NAME,
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
  | MicroappSetViewportSizeMessage
  | MicroappUserAuthenticatedMessage
  | MicroappAppSubscriptionMessage
  | MicroappRequireUserAuthenticatedMessage
  | MicroappRequestUserAuthenticatedMessage
  | MicroappRequireAppSubscriptionMessage
  | MicroappRequestAppSubscriptionMessage
  | MicroappUserJwtTokenMessage
  | MicroappRequestUserJwtTokenMessage;

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

export type MicroappUser = {
  id: string;
  pictureUrl: string;
  email: string;
};

export type MicroappUserAuthenticatedMessage = WindowMessage<
  typeof MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
  {
    user: MicroappUser | undefined;
  }
>;

export type MicroappRequireUserAuthenticatedMessage = WindowMessage<
  typeof MICROAPP_REQUIRE_USER_AUTHENTICATED_EVENT_NAME,
  {}
>;

export type MicroappRequestUserAuthenticatedMessage = WindowMessage<
  typeof MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME,
  {}
>;

export enum SubscriptionPlanCycle {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export type MicroappAppSubscription = {
  id: string;
  appId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  active: boolean;
  subscriptionPlan: {
    id: string;
    name: string;
    description?: string;
    priceInCents: number;
    cycle: SubscriptionPlanCycle;
    features: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
  };
  paymentsProvider?: string;
  paymentsSubscriptionManagementUrl?: string;
  paymentsSubscriptionId?: string;
  paymentsPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  endsAt?: Date;
};

export type MicroappAppSubscriptionMessage = WindowMessage<
  typeof MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
  {
    appSubscription: MicroappAppSubscription | undefined;
  }
>;

export type MicroappRequireAppSubscriptionMessage = WindowMessage<
  typeof MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME,
  {}
>;

export type MicroappRequestAppSubscriptionMessage = WindowMessage<
  typeof MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
  {}
>;

export type MicroappUserJwtTokenMessage = WindowMessage<
  typeof MICROAPP_USER_JWT_TOKEN_EVENT_NAME,
  {
    userJwtToken: string | undefined;
  }
>;

export type MicroappRequestUserJwtTokenMessage = WindowMessage<
  typeof MICROAPP_REQUEST_USER_JWT_TOKEN_EVENT_NAME,
  {}
>;
