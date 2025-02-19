import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';
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
  #resizeObserver?: ResizeObserver;
  #messageBus: MicroappMessageBus;
  #targetOrigin: string;

  constructor({
    iframeElement: iframe,
    url: src,
    theme,
    lang,
    targetOrigin = PRODUCTION_MARKETPLACE_HOST_URL,
  }: MicroappRuntimeOptions) {
    this.#iframe = iframe;
    this.#theme = theme ?? this.#theme;
    this.#lang = lang ?? this.#lang;
    this.#targetOrigin = targetOrigin;

    this.#baseRoute = window.location.pathname;
    this.#setIframeDimensions();

    this.#messageBus = new MicroappMessageBus({ targetOrigin });
    this.#messageBus.on(
      '@microapp:userPreferences',
      this.#handlePreferencesChange
    );
    this.#messageBus.on('@microapp:routeChange', this.#handleRouteChange);

    this.#iframe.addEventListener('load', () => {
      this.#updateUserPreferences();
      this.#injectRoutingScript();
    });

    this.#iframe.src = src;
  }

  destroy = () => {
    this.#messageBus.destroy();

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
  };

  update = (
    options: Partial<
      Pick<MicroappRuntimeOptions, 'theme' | 'lang' | 'url' | 'targetOrigin'>
    >
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
    if (options.targetOrigin) {
      this.#targetOrigin = options.targetOrigin;
    }

    this.#baseRoute = window.location.pathname;

    this.#updateUserPreferences();
  };

  #setIframeDimensions = () => {
    const parentElement = this.#iframe.parentElement;
    if (parentElement) {
      this.#resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.#iframe.style.width = `${width}px`;
          this.#iframe.style.height = `${height}px`;
        }
      });
      this.#resizeObserver.observe(parentElement);
    }
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
}
