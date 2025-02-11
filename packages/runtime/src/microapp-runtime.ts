import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

type MicroappRuntimeOptions = {
  iframeElement: HTMLIFrameElement;
  url: string;
  theme?: string;
  lang?: string;
  onRouteChange?: (route: string) => void;
};

export class MicroappRuntime {
  #iframe: HTMLIFrameElement;
  #theme: string = 'light';
  #lang: string = 'en-us';
  #baseRoute: string;
  #resizeObserver?: ResizeObserver;
  #onRouteChange?: (route: string) => void;

  constructor({
    iframeElement: iframe,
    url: src,
    theme,
    lang,
    onRouteChange,
  }: MicroappRuntimeOptions) {
    this.#iframe = iframe;
    this.#theme = theme ?? this.#theme;
    this.#lang = lang ?? this.#lang;
    this.#onRouteChange = onRouteChange;

    this.#baseRoute = window.location.pathname;
    this.#setIframeDimensions();

    window.addEventListener('message', this.#onMessageEvent);
    this.#iframe.addEventListener('load', () => {
      this.#updateUserPreferences();
      this.#injectRoutingScript();
    });
    this.#iframe.src = src;
  }

  destroy = () => {
    window.removeEventListener('message', this.#onMessageEvent);

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
    this.#iframe.remove();
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

  #onMessageEvent = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
      case '@microapp:userPreferences':
        return this.#updateUserPreferences();
      case '@microapp:routeChange':
        return this.#handleRouteChange(payload);
      default:
        return;
    }
  };

  #handleRouteChange = ({ route }: { route: string }) => {
    if (typeof window !== 'undefined') {
      const newRoute =
        route === '/'
          ? this.#baseRoute
          : this.#baseRoute.replace(/\/$/, '') + route;

      window.history.pushState({}, '', newRoute);
      this.#onRouteChange?.(newRoute);
    }
  };

  #updateUserPreferences = () => {
    const message = {
      type: '@microapp:userPreferences',
      payload: {
        theme: this.#theme,
        lang: this.#lang,
      },
    };

    this.#iframe.contentWindow?.postMessage(
      message,
      PRODUCTION_MARKETPLACE_HOST_URL
    );
  };

  #injectRoutingScript = () => {
    const iframeDoc = this.#iframe.contentDocument;
    if (!iframeDoc) return;

    if (iframeDoc.getElementById('microapp-routing-script')) return;

    const script = iframeDoc.createElement('script');
    script.id = 'microapp-routing-script';
    script.textContent = `
      if (!window.__microappRoutingInitialized) {
        window.__microappRoutingInitialized = true;

        function notifyRouteChange(method) {
          const currentRoute = window.location.pathname;
          window.parent.postMessage({ type: '@microapp:routeChange', payload: { route: currentRoute }}, PRODUCTION_MARKETPLACE_HOST_URL);
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
  };
}
