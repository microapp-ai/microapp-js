import {
  PRODUCTION_MARKETPLACE_HOSTNAME,
  STAGING_MARKETPLACE_HOSTNAME,
} from './constants';
import { MicroappMessageBus } from './microapp-message-bus';

type MicroappRuntimeOptions = {
  iframeElement: HTMLIFrameElement;
  url: string;
  theme?: string;
  lang?: string;
  targetOrigin?: string;
};

export class MicroappRuntime {
  #iframe: HTMLIFrameElement;
  #theme: string = 'light';
  #lang: string = 'en-us';
  #baseRoute: string;
  #messageBus: MicroappMessageBus;
  #targetOrigin: string | undefined;

  constructor({
    iframeElement: iframe,
    url: src,
    theme,
    lang,
  }: MicroappRuntimeOptions) {
    this.#iframe = iframe;

    this.#theme = theme ?? this.#theme;
    this.#lang = lang ?? this.#lang;

    this.#baseRoute = window.location.pathname;

    this.#targetOrigin = this.#getAllowedTargetOriginOrThrow();
    this.#messageBus = new MicroappMessageBus({
      targetOrigin: this.#targetOrigin,
    });
    this.#messageBus.on(
      '@microapp:userPreferences',
      this.#handlePreferencesChange
    );
    this.#messageBus.on('@microapp:routeChange', this.#handleRouteChange);
    this.#messageBus.on('@microapp:resize', this.#handleIframeResize);

    this.#updateUserPreferences();

    this.#iframe.addEventListener('load', () => {
      this.#injectIframeDimensionsScript();
      this.#injectRoutingScript();
    });

    const searchParams = new URLSearchParams();
    if (theme) searchParams.append('theme', theme);
    if (lang) searchParams.append('lang', lang);

    const queryString = searchParams.toString();
    const srcWithParams = queryString ? `${src}?${queryString}` : src;

    this.#iframe.src = srcWithParams;
  }

  destroy = () => {
    this.#messageBus.destroy();
  };

  update = (
    options: Partial<Pick<MicroappRuntimeOptions, 'theme' | 'lang' | 'url'>>
  ) => {
    if (options.theme) {
      this.#theme = options.theme;
    }
    if (options.lang) {
      this.#lang = options.lang;
    }
    if (options.url) {
      this.#iframe.src = options.url;
    }

    this.#baseRoute = window.location.pathname;

    this.#updateUserPreferences();
  };

  #getAllowedTargetOriginOrThrow = () => {
    const parentWindow = window.parent;

    if (!parentWindow) {
      throw new Error(
        'The runtime SDK should be consumed inside the marketplace'
      );
    }

    const parentUrl = new URL(window.location.href);
    const isParentUrlAllowed =
      parentUrl.hostname === PRODUCTION_MARKETPLACE_HOSTNAME ||
      parentUrl.hostname === STAGING_MARKETPLACE_HOSTNAME;

    if (!isParentUrlAllowed) {
      throw new Error(
        'The runtime SDK should be consumed inside the marketplace'
      );
    }

    return parentUrl.origin;
  };

  #handlePreferencesChange = ({
    theme,
    lang,
  }: {
    theme?: string;
    lang?: string;
  }) => {
    if (theme) this.#theme = theme;
    if (lang) this.#lang = lang;

    this.#updateUserPreferences();
  };

  #handleRouteChange = ({ route }: { route: string }) => {
    if (typeof window !== 'undefined') {
      const newRoute =
        route === '/'
          ? this.#baseRoute
          : this.#baseRoute.replace(/\/$/, '') + route;

      window.history.pushState({}, '', newRoute);
    }
  };

  #updateUserPreferences = () => {
    this.#messageBus.send(
      '@microapp:userPreferences',
      {
        theme: this.#theme,
        lang: this.#lang,
      },
      this.#iframe.contentWindow ?? undefined
    );
  };

  #injectRoutingScript = () => {
    const iframeDoc = this.#iframe.contentDocument;
    if (!iframeDoc) return;

    if (this.#iframe.dataset.hasRoutingScript) {
      return;
    }

    const script = iframeDoc.createElement('script');
    script.id = 'microapp-routing-script';
    script.textContent = `
      if (!window.__microappRoutingInitialized) {
        window.__microappRoutingInitialized = true;

        function notifyRouteChange(method) {
          const currentRoute = window.location.pathname;
          window.parent.postMessage(
            { 
              type: '@microapp:routeChange', 
              payload: { route: currentRoute }
            }, 
            '${this.#targetOrigin}'
          );
        }

        window.addEventListener('popstate', () => {
          notifyRouteChange();
        });

        const originalPushState = history.pushState;
        history.pushState = function(...args) {
          originalPushState.apply(this, args);
          notifyRouteChange();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function(...args) {
          originalReplaceState.apply(this, args);
          notifyRouteChange();
        };
      }
    `;
    iframeDoc.head.appendChild(script);

    this.#iframe.dataset.hasRoutingScript = 'true';
  };

  #handleIframeResize = ({ height }: { height: number }) => {
    if (this.#iframe) {
      this.#iframe.style.height = `${height}px`;
    }
  };

  #injectIframeDimensionsScript = () => {
    const iframeDoc = this.#iframe.contentDocument;
    if (!iframeDoc) return;

    if (this.#iframe.dataset.hasResizeScript) {
      return;
    }

    const script = iframeDoc.createElement('script');
    script.id = 'microapp-resize-script';
    script.textContent = `
      (function() {
        if (!window.__microappResizeInitialized) {
          window.__microappResizeInitialized = true;
  
          function throttle(callback, delay) {
            let last;
            let timer;
            return function() {
              const context = this;
              const now = +new Date();
              const args = arguments;
              if (last && now < last + delay) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                  last = now;
                  callback.apply(context, args);
                }, delay);
              } else {
                last = now;
                callback.apply(context, args);
              }
            };
          }
  
          const sendHeight = throttle(() => {
            const height = document.body.scrollHeight || document.documentElement.scrollHeight;
            window.parent.postMessage({ type: '@microapp:resize', payload: { height }}, '${
              this.#targetOrigin
            }');
          }, 100);
  
          const mutationObserver = new MutationObserver(sendHeight);
          mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          });
  
          const resizeObserver = new ResizeObserver(sendHeight);
          resizeObserver.observe(document.body);
  
          ['load', 'resize', 'DOMContentLoaded'].forEach(event => {
            window.addEventListener(event, sendHeight);
          });
        }
      }());
    `;
    iframeDoc.head.appendChild(script);

    this.#iframe.dataset.hasResizeScript = 'true';
  };
}
