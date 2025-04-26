import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  DEFAULT_MICROAPP_LANGUAGE,
  DEFAULT_MICROAPP_THEME,
  MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME,
  MICROAPP_INIT_EVENT_NAME,
  MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_REQUIRE_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME,
  MICROAPP_URL_PARAM_NAMES,
  MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';
import { MicroappMessageBus } from './microapp-message-bus';
import type {
  MicroappAppSubscription,
  MicroappLanguage,
  MicroappMessagePayload,
  MicroappMessages,
  MicroappResizeMessage,
  MicroappRouteChangeMessage,
  MicroappTheme,
  MicroappUser,
} from './types';

import {
  buildOriginUrl,
  buildPathnameWithBeginningAndTrailingSlash,
  buildUrlOrCurrentWindowLocation,
  buildUrlWithTrailingSlash,
  removeTrailingSlashFromUrl,
  throttle,
} from './utils';
import { buildMicroappUrl } from './build-microapp-url';
import { MicroappRouteState } from './microapp-route-state';

export type MicroappRuntimeOptions = {
  id: string;
  iframe: HTMLIFrameElement;
  homeUrl: string;
  baseUrl?: URL | string;
  currentUrl?: URL | string;
  targetOrigin?: string;
  theme?: MicroappTheme;
  lang?: MicroappLanguage;
  user?: MicroappUser;
  onRequireUser: () => void;
  appSubscription?: MicroappAppSubscription;
  onRequireAppSubscription: () => void;
};

export class MicroappRuntime {
  readonly #id: string;
  readonly #iframe: HTMLIFrameElement;
  readonly #messageBus: MicroappMessageBus;
  #homeUrl: URL;
  #baseUrl: URL | undefined;
  #currentUrl: URL | undefined;
  #targetOrigin: string;
  #src: string;

  #theme: MicroappTheme = DEFAULT_MICROAPP_THEME;
  #lang: MicroappLanguage = DEFAULT_MICROAPP_LANGUAGE;

  #user: MicroappUser | undefined;
  #onRequireUser: () => void;
  #appSubscription: MicroappAppSubscription | undefined;
  #onRequireAppSubscription: () => void;

  #hasInitialized = false;
  #pendingMessages: MicroappMessages[] = [];

  #tearDownMessageBus: (() => void) | null = null;
  #tearDownWindowEventListeners: (() => void) | null = null;

  constructor({
    id,
    iframe,
    homeUrl,
    baseUrl,
    currentUrl,
    targetOrigin,
    theme,
    lang,
    user,
    onRequireUser,
    appSubscription,
    onRequireAppSubscription,
  }: MicroappRuntimeOptions) {
    this.#id = id;
    this.#iframe = iframe;
    this.#homeUrl = buildUrlWithTrailingSlash(homeUrl);

    this.#theme = theme ?? this.#theme;
    this.#lang = lang ?? this.#lang;

    this.#targetOrigin = targetOrigin
      ? this.#buildAllowedTargetOriginOrThrow(targetOrigin)
      : this.#getWindowAllowedTargetOriginOrThrow(iframe);

    this.#baseUrl = buildUrlOrCurrentWindowLocation(baseUrl);
    this.#currentUrl = buildUrlOrCurrentWindowLocation(currentUrl);

    this.#src = buildMicroappUrl(this.#homeUrl, {
      baseUrl: this.#baseUrl,
      currentUrl: this.#currentUrl,
      targetOrigin: this.#targetOrigin,
      theme: this.#theme,
      lang: this.#lang,
    });

    this.#user = user;
    this.#onRequireUser = onRequireUser;
    this.#appSubscription = appSubscription;
    this.#onRequireAppSubscription = onRequireAppSubscription;

    this.#messageBus = new MicroappMessageBus({
      targetOrigin: buildOriginUrl(this.#src),
    });

    this.setUp();
  }

  setUp(): void {
    this.#iframe.src = this.#src;
    this.#setUpMessageBus();
    this.#setUpWindowEventListeners();
    this.#updateUserPreferences();
    this.#updateUser();
    this.#updateAppSubscription();
  }

  tearDown(): void {
    if (this.#tearDownMessageBus) {
      this.#tearDownMessageBus();
      this.#tearDownMessageBus = null;
    }

    if (this.#tearDownWindowEventListeners) {
      this.#tearDownWindowEventListeners();
      this.#tearDownWindowEventListeners = null;
    }

    this.#iframe.src = '';
  }

  #setUpMessageBus() {
    const tearDownInit = this.#messageBus.on(
      MICROAPP_INIT_EVENT_NAME,
      this.#handleInit
    );

    const tearDownRouteChange = this.#messageBus.on(
      MICROAPP_ROUTE_CHANGE_EVENT_NAME,
      this.#handleRouteChange
    );

    const tearDownResize = this.#messageBus.on(
      MICROAPP_RESIZE_EVENT_NAME,
      this.#handleIframeResize
    );

    const tearDownRequireAppSubscription = this.#messageBus.on(
      MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME,
      this.#handleRequireAppSubscription
    );

    const tearDownRequestAppSubscription = this.#messageBus.on(
      MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
      this.#handleRequestAppSubscription
    );

    const tearDownRequireUser = this.#messageBus.on(
      MICROAPP_REQUIRE_USER_AUTHENTICATED_EVENT_NAME,
      this.#handleRequireUser
    );

    const tearDownRequestUser = this.#messageBus.on(
      MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME,
      this.#handleRequestUser
    );

    this.#tearDownMessageBus = () => {
      tearDownInit();
      tearDownRouteChange();
      tearDownResize();
      tearDownRequireAppSubscription();
      tearDownRequestAppSubscription();
      tearDownRequireUser();
      tearDownRequestUser();
    };
  }

  #handleInit = () => {
    const iframeContentWindow = this.#getIframeContentWindowOrThrow();

    this.#messageBus.send(
      MICROAPP_INIT_ACKNOWLEDGEMENT_EVENT_NAME,
      {
        id: this.#id,
        theme: this.#theme,
        lang: this.#lang,
      },
      iframeContentWindow
    );

    for (const message of this.#pendingMessages) {
      console.info('[@microapp-io/runtime] Sending pending message', message);
      this.#messageBus.send(message.type, message.payload, iframeContentWindow);
    }

    this.#hasInitialized = true;
    this.#pendingMessages = [];
  };

  #getIframeContentWindowOrThrow = (): Window => {
    const contentWindow = this.#iframe.contentWindow;
    if (!contentWindow) {
      throw new Error(
        '[@microapp-io/runtime] The iframe does not have a content window'
      );
    }
    return contentWindow;
  };

  #handleRouteChange = ({
    url: urlString,
  }: MicroappMessagePayload<MicroappRouteChangeMessage>) => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = buildUrlWithTrailingSlash(urlString);
    const newPath = this.#buildHistoryPathFromUrl(url);
    const currentPath = window.location.pathname;

    if (currentPath === newPath) {
      return;
    }

    const currentHash = window.location.hash;
    const newPathWithHash = `${newPath}${currentHash}`;

    // NB: We use replaceState instead of pushState to avoid adding to the history stack twice
    window.history.replaceState(
      new MicroappRouteState({
        homeUrl: this.#homeUrl.toString(),
        path: newPath,
      }),
      '',
      newPathWithHash
    );
  };

  #buildHistoryPathFromUrl = (url: URL): string => {
    const urlSearchParams = new URLSearchParams(url.search);

    for (const paramName of Object.values(MICROAPP_URL_PARAM_NAMES)) {
      urlSearchParams.delete(paramName);
    }

    let path = buildPathnameWithBeginningAndTrailingSlash(url.pathname);

    if (this.#baseUrl) {
      // Extract relative path if needed and format it properly
      path = path.startsWith(this.#baseUrl.pathname)
        ? buildPathnameWithBeginningAndTrailingSlash(
            path.slice(this.#baseUrl.pathname.length)
          )
        : path;

      // Handle special case for root path or concatenate paths
      path =
        path === '/'
          ? this.#baseUrl.pathname
          : removeTrailingSlashFromUrl(this.#baseUrl.pathname) +
            buildPathnameWithBeginningAndTrailingSlash(path);

      // Ensure consistent formatting
      path = buildPathnameWithBeginningAndTrailingSlash(path);
    }

    const searchParams = urlSearchParams.toString();

    if (searchParams) {
      path += `?${searchParams}`;
    }

    return path;
  };

  #handleIframeResize = ({
    heightInPixel,
  }: MicroappMessagePayload<MicroappResizeMessage>) => {
    if (this.#iframe) {
      this.#iframe.style.height = `${heightInPixel}px`;
    }
  };

  #handleRequireAppSubscription = () => {
    if (this.#appSubscription) {
      console.log(
        '[@microapp-io/runtime] App subscription already exists, no need to require it again'
      );
      return;
    }

    if (typeof window === 'undefined') {
      console.warn(
        '[@microapp-io/runtime] App subscription is not available in this environment'
      );
      return;
    }

    console.log(
      '[@microapp-io/runtime] App subscription required, notifying the host'
    );
    this.#onRequireAppSubscription();
  };

  #handleRequestAppSubscription = () => {
    if (this.#appSubscription) {
      console.log(
        '[@microapp-io/runtime] Found app subscription, notifying the host'
      );
      this.#sendMessageIfInitialized(
        MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
        { appSubscription: this.#appSubscription }
      );
      return;
    }

    console.warn(
      '[@microapp-io/runtime] No app subscription found, notifying the host'
    );
  };

  #handleRequireUser = () => {
    if (this.#user) {
      console.log(
        '[@microapp-io/runtime] User already exists, no need to require it again'
      );
      return;
    }

    if (typeof window === 'undefined') {
      console.warn(
        '[@microapp-io/runtime] User is not available in this environment'
      );
      return;
    }

    console.log('[@microapp-io/runtime] User required, notifying the host');
    this.#onRequireUser();
  };

  #handleRequestUser = () => {
    if (this.#user) {
      console.log('[@microapp-io/runtime] Found user, notifying the host');
      this.#sendMessageIfInitialized(MICROAPP_USER_AUTHENTICATED_EVENT_NAME, {
        user: this.#user,
      });
      return;
    }

    console.warn('[@microapp-io/runtime] No user found, notifying the host');
  };

  #updateUserPreferences = () => {
    this.#sendMessageIfInitialized(MICROAPP_USER_PREFERENCES_EVENT_NAME, {
      theme: this.#theme,
      lang: this.#lang,
    });
  };

  #updateUser = () => {
    this.#sendMessageIfInitialized(MICROAPP_USER_AUTHENTICATED_EVENT_NAME, {
      user: this.#user,
    });
  };

  #updateAppSubscription = () => {
    this.#sendMessageIfInitialized(MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME, {
      appSubscription: this.#appSubscription,
    });
  };

  #sendMessageIfInitialized = (
    type: MicroappMessages['type'],
    payload: MicroappMessages['payload']
  ) => {
    if (this.#hasInitialized) {
      this.#messageBus.send(
        type,
        payload,
        this.#getIframeContentWindowOrThrow()
      );
      return;
    }
    this.#pendingMessages.push({ type, payload } as MicroappMessages);
  };

  #setUpWindowEventListeners() {
    if (typeof window === 'undefined') {
      return;
    }

    const notifySetViewportSize = throttle(
      (trigger: MicroappMessagePayload<MicroappResizeMessage>['trigger']) => {
        this.#sendMessageIfInitialized(MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME, {
          trigger,
          widthInPixel: window.innerWidth,
          heightInPixel: window.innerHeight,
        });
      },
      100
    );

    const tearDownListeners: Array<() => void> = [];

    ['resize', 'orientationchange', 'fullscreenchange'].forEach((eventName) => {
      const eventListener = () => {
        notifySetViewportSize(
          eventName as MicroappMessagePayload<MicroappResizeMessage>['trigger']
        );
      };
      window.addEventListener(eventName, eventListener);
      tearDownListeners.push(() => {
        window.removeEventListener(eventName, eventListener);
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      notifySetViewportSize('resizeObserver');
    });

    resizeObserver.observe(document.body);
    tearDownListeners.push(() => {
      resizeObserver.disconnect();
    });

    const mutationObserver = new MutationObserver(() => {
      notifySetViewportSize('mutationObserver');
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    tearDownListeners.push(() => {
      mutationObserver.disconnect();
    });

    notifySetViewportSize('load');

    this.#tearDownWindowEventListeners = () => {
      for (const tearDownListener of tearDownListeners) {
        tearDownListener();
      }
    };
  }

  update(
    options: Partial<
      Pick<
        MicroappRuntimeOptions,
        | 'homeUrl'
        | 'baseUrl'
        | 'currentUrl'
        | 'targetOrigin'
        | 'theme'
        | 'lang'
        | 'user'
        | 'onRequireUser'
        | 'appSubscription'
        | 'onRequireAppSubscription'
      >
    >
  ): void {
    if (options.homeUrl) {
      this.#homeUrl = buildUrlWithTrailingSlash(options.homeUrl);
    }

    if (options.baseUrl) {
      this.#baseUrl = buildUrlWithTrailingSlash(options.baseUrl);
    }

    if (options.currentUrl) {
      this.#currentUrl = buildUrlWithTrailingSlash(options.currentUrl);
    }

    if (options.targetOrigin) {
      this.#targetOrigin = options.targetOrigin;
    }

    if (options.theme) {
      this.#theme = options.theme;
    }

    if (options.lang) {
      this.#lang = options.lang;
    }

    if (options.user) {
      this.#user = options.user;
    }

    if (options.onRequireUser) {
      this.#onRequireUser = options.onRequireUser;
    }

    if (options.appSubscription) {
      this.#appSubscription = options.appSubscription;
    }

    if (options.onRequireAppSubscription) {
      this.#onRequireAppSubscription = options.onRequireAppSubscription;
    }

    const shouldUpdateIframeSrc =
      'homeUrl' in options ||
      'baseUrl' in options ||
      'currentUrl' in options ||
      'targetOrigin' in options;

    if (shouldUpdateIframeSrc) {
      this.#src = buildMicroappUrl(options.homeUrl ?? this.#homeUrl, {
        baseUrl: this.#baseUrl,
        currentUrl: this.#currentUrl,
        targetOrigin: this.#targetOrigin,
        theme: this.#theme,
        lang: this.#lang,
      });

      this.#iframe.src = this.#src;
      this.#messageBus.targetOrigin = buildOriginUrl(this.#src);
    }

    const shouldUpdateUserPreferences = 'theme' in options || 'lang' in options;

    if (shouldUpdateUserPreferences) {
      this.#updateUserPreferences();
    }

    const shouldUpdateUser = 'user' in options;

    if (shouldUpdateUser) {
      this.#updateUser();
    }

    const shouldUpdateSubscription = 'appSubscription' in options;

    if (shouldUpdateSubscription) {
      this.#updateAppSubscription();
    }
  }

  #getWindowAllowedTargetOriginOrThrow = (
    iframe: HTMLIFrameElement
  ): string => {
    const parentWindow = iframe.contentWindow?.parent;

    if (!parentWindow) {
      throw new Error(
        '[@microapp-io/runtime] The iframe does not have a parent window'
      );
    }

    const parentUrl = buildUrlWithTrailingSlash(parentWindow.origin);
    return this.#buildAllowedTargetOriginOrThrow(parentUrl);
  };

  #buildAllowedTargetOriginOrThrow = (targetOrigin: URL | string): string => {
    targetOrigin = buildUrlWithTrailingSlash(targetOrigin.toString());
    const isParentUrlAllowed = ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.includes(
      targetOrigin.hostname
    );

    if (!isParentUrlAllowed) {
      throw new Error(
        '[@microapp-io/runtime] The parent window origin is only allowed to be the production or staging marketplace URLs'
      );
    }

    targetOrigin.pathname = removeTrailingSlashFromUrl(targetOrigin.pathname);

    return targetOrigin.toString();
  };
}
