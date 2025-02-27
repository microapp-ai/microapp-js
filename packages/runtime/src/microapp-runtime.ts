import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  DEFAULT_MICROAPP_LANGUAGE,
  DEFAULT_MICROAPP_THEME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME,
  MICROAPP_URL_PARAM_NAMES,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';
import { MicroappMessageBus } from './microapp-message-bus';
import type {
  MicroappLanguage,
  MicroappMessagePayload,
  MicroappResizeMessage,
  MicroappRouteChangeMessage,
  MicroappTheme,
  MicroappUserPreferencesMessage,
} from './types';

import {
  buildPathnameWithTrailingSlash,
  buildUrlWithTrailingSlash,
  removeTrailingSlashFromUrl,
  throttle,
} from './utils';
import { buildMicroappUrl } from './build-microapp-url';
import { buildUrlOrCurrentWindowLocation } from './utils/build-url-or-current-window-location';

export type MicroappRuntimeOptions = {
  iframe: HTMLIFrameElement;
  homeUrl: string;
  baseUrl?: URL | string;
  currentUrl?: URL | string;
  targetOrigin?: string;
  theme?: MicroappTheme;
  lang?: MicroappLanguage;
};

export class MicroappRuntime {
  readonly #iframe: HTMLIFrameElement;
  readonly #messageBus: MicroappMessageBus;
  #homeUrl: URL;
  #baseUrl: URL | undefined;
  #currentUrl: URL | undefined;
  #targetOrigin: string;
  #src: string;

  #theme: MicroappTheme = DEFAULT_MICROAPP_THEME;
  #lang: MicroappLanguage = DEFAULT_MICROAPP_LANGUAGE;

  constructor({
    iframe,
    homeUrl,
    baseUrl,
    currentUrl,
    targetOrigin,
    theme,
    lang,
  }: MicroappRuntimeOptions) {
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

    this.#iframe.src = this.#src;
    this.#messageBus = new MicroappMessageBus({
      targetOrigin: this.#targetOrigin,
    });

    this.#setUpMessageBus();

    this.#updateUserPreferences();
    this.#setUpWindowEventListeners();
  }

  #setUpMessageBus() {
    this.#messageBus.on(
      MICROAPP_ROUTE_CHANGE_EVENT_NAME,
      this.#handleRouteChange
    );
    this.#messageBus.on(MICROAPP_RESIZE_EVENT_NAME, this.#handleIframeResize);
    this.#messageBus.on(
      MICROAPP_USER_PREFERENCES_EVENT_NAME,
      this.#handlePreferencesChange
    );
  }

  #handleRouteChange = ({
    url: urlString,
  }: MicroappMessagePayload<MicroappRouteChangeMessage>) => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = buildUrlWithTrailingSlash(urlString);
    const path = this.#buildHistoryPathFromUrl(url);
    window.history.pushState({}, '', path);
  };

  #buildHistoryPathFromUrl = (url: URL): string => {
    const urlSearchParams = new URLSearchParams(url.search);

    for (const paramName of Object.values(MICROAPP_URL_PARAM_NAMES)) {
      urlSearchParams.delete(paramName);
    }

    let path = buildPathnameWithTrailingSlash(url.pathname);

    if (this.#baseUrl) {
      path =
        path === '/'
          ? this.#baseUrl.pathname
          : removeTrailingSlashFromUrl(this.#baseUrl.pathname) + url.pathname;
      path = buildPathnameWithTrailingSlash(path);
    }

    const searchParams = urlSearchParams.toString();

    if (searchParams) {
      path += `?${searchParams}`;
    }

    if (url.hash) {
      path += `#${url.hash}`;
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

  #handlePreferencesChange = ({
    theme,
    lang,
  }: MicroappMessagePayload<MicroappUserPreferencesMessage>) => {
    if (theme) this.#theme = theme;
    if (lang) this.#lang = lang;

    this.#updateUserPreferences();
  };

  #updateUserPreferences = () => {
    this.#messageBus.send(
      MICROAPP_USER_PREFERENCES_EVENT_NAME,
      {
        theme: this.#theme,
        lang: this.#lang,
      },
      this.#iframe.contentWindow ?? undefined
    );
  };

  #setUpWindowEventListeners() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('popstate', () => {
      this.#messageBus.send(MICROAPP_ROUTE_CHANGE_EVENT_NAME, {
        trigger: 'popstate',
        url: window.location.href,
      });
    });

    const notifySetViewportSize = throttle(
      (trigger: MicroappMessagePayload<MicroappResizeMessage>['trigger']) => {
        this.#messageBus.send(MICROAPP_SET_VIEWPORT_SIZE_EVENT_NAME, {
          trigger,
          widthInPixel: window.innerWidth,
          heightInPixel: window.innerHeight,
        });
      },
      100
    );

    ['resize', 'orientationchange', 'fullscreenchange'].forEach((eventName) => {
      window.addEventListener(eventName, () => {
        notifySetViewportSize(
          eventName as MicroappMessagePayload<MicroappResizeMessage>['trigger']
        );
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      notifySetViewportSize('resizeObserver');
    });

    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(() => {
      notifySetViewportSize('mutationObserver');
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    notifySetViewportSize('load');
  }

  update(
    options: Partial<
      Pick<
        MicroappRuntimeOptions,
        'homeUrl' | 'baseUrl' | 'currentUrl' | 'targetOrigin' | 'theme' | 'lang'
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

    const shouldUpdateIframeSrc =
      'url' in options ||
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
    }

    const shouldUpdateUserPreferences = 'theme' in options || 'lang' in options;

    if (shouldUpdateUserPreferences) {
      this.#updateUserPreferences();
    }
  }

  #getWindowAllowedTargetOriginOrThrow = (
    iframe: HTMLIFrameElement
  ): string => {
    const parentWindow = iframe.contentWindow?.parent;

    if (!parentWindow) {
      throw new Error(
        '[MicroappRuntime] The iframe does not have a parent window.'
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
        '[MicroappRuntime] The parent window origin is only allowed to be the production or staging marketplace URLs.'
      );
    }

    targetOrigin.pathname = removeTrailingSlashFromUrl(targetOrigin.pathname);

    return targetOrigin.toString();
  };
}
