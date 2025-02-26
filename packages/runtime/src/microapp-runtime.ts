import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  DEFAULT_MICROAPP_LANGUAGE,
  DEFAULT_MICROAPP_THEME,
  MICROAPP_RESIZE_EVENT_NAME,
  MICROAPP_ROUTE_CHANGE_EVENT_NAME,
  MICROAPP_URL_PARAM_NAMES,
  MICROAPP_USER_PREFERENCES_EVENT_NAME,
} from './constants';
import type {
  MicroappResizeMessagePayload,
  MicroappRouteChangeMessagePayload,
  MicroappUserPreferencesMessagePayload,
} from './microapp-message-bus';
import { MicroappMessageBus } from './microapp-message-bus';
import type { MicroappLanguage, MicroappTheme } from './types';

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
  static getUserPreferencesFromIframeSrc(
    iframeSrc: string
  ): MicroappUserPreferencesMessagePayload {
    const urlSearchParams = new URLSearchParams(iframeSrc);
    const theme = (urlSearchParams.get(MICROAPP_URL_PARAM_NAMES.THEME) ??
      undefined) as MicroappTheme | undefined;
    const lang = (urlSearchParams.get(MICROAPP_URL_PARAM_NAMES.LANGUAGE) ??
      undefined) as MicroappLanguage | undefined;

    return { theme, lang };
  }

  static buildIframeSrcFromUrl = (
    microappUrl: URL | string,
    {
      baseUrl,
      currentUrl,
      targetOrigin,
      theme,
      lang,
    }: {
      baseUrl?: URL | string;
      currentUrl?: URL | string;
      targetOrigin: URL | string;
      theme?: MicroappTheme;
      lang?: MicroappLanguage;
    }
  ): string => {
    const iframeUrl = MicroappRuntime.#buildUrl(microappUrl);
    const searchParams = new URLSearchParams(iframeUrl.search);
    searchParams.append(
      MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN,
      targetOrigin.toString()
    );

    if (theme) searchParams.append(MICROAPP_URL_PARAM_NAMES.THEME, theme);
    if (lang) searchParams.append(MICROAPP_URL_PARAM_NAMES.LANGUAGE, lang);

    const queryString = searchParams.toString();
    iframeUrl.search = queryString;

    if (!currentUrl && typeof window !== 'undefined') {
      currentUrl = MicroappRuntime.#buildUrl(window.location.href);
    }

    if (baseUrl && currentUrl) {
      baseUrl = MicroappRuntime.#buildUrl(baseUrl);
      currentUrl = MicroappRuntime.#buildUrl(currentUrl);
      const currentPath = currentUrl.pathname.replace(baseUrl.pathname, '/');
      iframeUrl.pathname = currentPath;
    }

    return iframeUrl.toString();
  };

  static #buildUrl = (url: URL | string): URL => {
    url = new URL(url.toString());
    url.pathname = MicroappRuntime.#buildPathname(url.pathname);

    return url;
  };

  static #buildPathname = (url: string): string => {
    if (!url.endsWith('/')) {
      url += '/';
    }

    return url;
  };

  static #removeTrailingSlashFromUrl = (url: string): string => {
    return url.replace(/\/$/, '');
  };

  static #buildUrlOrCurrentWindowLocation = (
    url?: URL | string
  ): URL | undefined => {
    if (url) {
      return MicroappRuntime.#buildUrl(url);
    }

    if (typeof window !== 'undefined') {
      return MicroappRuntime.#buildUrl(window.location.href);
    }

    return undefined;
  };

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
    this.#homeUrl = MicroappRuntime.#buildUrl(homeUrl);

    this.#theme = theme ?? this.#theme;
    this.#lang = lang ?? this.#lang;
    this.#targetOrigin = targetOrigin
      ? this.#buildAllowedTargetOriginOrThrow(targetOrigin)
      : this.#getWindowAllowedTargetOriginOrThrow(iframe);

    this.#baseUrl = MicroappRuntime.#buildUrlOrCurrentWindowLocation(baseUrl);
    this.#currentUrl =
      MicroappRuntime.#buildUrlOrCurrentWindowLocation(currentUrl);

    this.#src = MicroappRuntime.buildIframeSrcFromUrl(this.#homeUrl, {
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

    this.#messageBus.on(
      MICROAPP_ROUTE_CHANGE_EVENT_NAME,
      this.#handleRouteChange
    );
    this.#messageBus.on(MICROAPP_RESIZE_EVENT_NAME, this.#handleIframeResize);
    this.#messageBus.on(
      MICROAPP_USER_PREFERENCES_EVENT_NAME,
      this.#handlePreferencesChange
    );

    this.#updateUserPreferences();

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.#messageBus.send(MICROAPP_ROUTE_CHANGE_EVENT_NAME, {
          url: window.location.href,
        });
      });
    }
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
      this.#homeUrl = MicroappRuntime.#buildUrl(options.homeUrl);
    }

    if (options.baseUrl) {
      this.#baseUrl = MicroappRuntime.#buildUrl(options.baseUrl);
    }

    if (options.currentUrl) {
      this.#currentUrl = MicroappRuntime.#buildUrl(options.currentUrl);
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
      this.#src = MicroappRuntime.buildIframeSrcFromUrl(
        options.homeUrl ?? this.#homeUrl,
        {
          baseUrl: this.#baseUrl,
          currentUrl: this.#currentUrl,
          targetOrigin: this.#targetOrigin,
          theme: this.#theme,
          lang: this.#lang,
        }
      );

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

    const parentUrl = MicroappRuntime.#buildUrl(parentWindow.origin);
    return this.#buildAllowedTargetOriginOrThrow(parentUrl);
  };

  #buildAllowedTargetOriginOrThrow = (targetOrigin: URL | string): string => {
    targetOrigin = MicroappRuntime.#buildUrl(targetOrigin.toString());
    const isParentUrlAllowed = ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.includes(
      targetOrigin.hostname
    );

    if (!isParentUrlAllowed) {
      throw new Error(
        '[MicroappRuntime] The parent window origin is only allowed to be the production or staging marketplace URLs.'
      );
    }

    targetOrigin.pathname = MicroappRuntime.#removeTrailingSlashFromUrl(
      targetOrigin.pathname
    );

    return targetOrigin.toString();
  };

  #handlePreferencesChange = ({
    theme,
    lang,
  }: MicroappUserPreferencesMessagePayload) => {
    if (theme) this.#theme = theme;
    if (lang) this.#lang = lang;

    this.#updateUserPreferences();
  };

  #handleRouteChange = ({
    url: urlString,
  }: MicroappRouteChangeMessagePayload) => {
    if (typeof window !== 'undefined') {
      const url = MicroappRuntime.#buildUrl(urlString);
      const path = this.#buildHistoryPathFromUrl(url);
      window.history.pushState({}, '', path);
    }
  };

  #buildHistoryPathFromUrl = (url: URL): string => {
    const urlSearchParams = new URLSearchParams(url.search);

    for (const paramName of Object.values(MICROAPP_URL_PARAM_NAMES)) {
      urlSearchParams.delete(paramName);
    }

    let path = MicroappRuntime.#buildPathname(url.pathname);

    if (this.#baseUrl) {
      path = MicroappRuntime.#buildPathname(
        path === '/'
          ? this.#baseUrl.pathname
          : MicroappRuntime.#removeTrailingSlashFromUrl(
              this.#baseUrl.pathname
            ) + url.pathname
      );
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

  #handleIframeResize = ({ heightInPixel }: MicroappResizeMessagePayload) => {
    if (this.#iframe) {
      this.#iframe.style.height = `${heightInPixel}px`;
    }
  };
}
