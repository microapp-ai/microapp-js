// import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

type MicroappRuntimeOptions = {
  iframeElement: HTMLIFrameElement;
  url: string;
  timeout?: number;
  theme?: string;
  lang?: string;
  onRouteChange?: (route: string) => void;
};

export class MicroappRuntime {
  #iframe: HTMLIFrameElement;
  #theme?: string;
  #lang?: string;
  #onRouteChange?: (route: string) => void;

  #baseRoute: string;

  constructor({
    iframeElement: iframe,
    url: src,
    theme,
    lang,
    onRouteChange,
  }: MicroappRuntimeOptions) {
    this.#iframe = iframe;
    this.#theme = theme;
    this.#lang = lang;
    this.#onRouteChange = onRouteChange;

    this.#baseRoute = window.location.pathname;

    window.addEventListener('message', this.#onMessageEvent);
    window.addEventListener('resize', this.setIframeDimensions);

    this.#iframe.addEventListener('load', () => {
      this.#updateUserPreferences();
      this.#injectRoutingScript();
    });
    this.#iframe.src = src;
  }

  destroy() {
    window.removeEventListener('message', this.#onMessageEvent);
    window.removeEventListener('resize', this.setIframeDimensions);

    this.#iframe.removeEventListener('load', this.#updateUserPreferences);
  }

  #onMessageEvent = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
      case '@microapp:updateUserPreferences':
        return this.#updateUserPreferences();
      case '@microapp:routeChange':
        return this.#handleRouteChange(payload);
      default:
        return;
    }
  };

  setIframeDimensions = () => {
    const parentElement = this.#iframe.parentElement;
    if (parentElement) {
      const { width, height } = parentElement.getBoundingClientRect();
      this.#iframe.style.width = `${width}px`;
      this.#iframe.style.height = `${height}px`;
    }
  };

  setIframeTheme = (theme: string) => {
    this.#theme = theme;
    this.#updateUserPreferences();
  };

  #updateUserPreferences = () => {
    const message = {
      type: '@microapp:userpreferences',
      payload: {
        theme: this.#theme,
        lang: this.#lang,
      },
    };

    const targetOrigin = new URL(this.#iframe.src).origin;
    this.#iframe.contentWindow?.postMessage(message, targetOrigin);
  };

  #handleRouteChange = ({ route, method }: { route: string; method: any }) => {
    if (typeof window !== 'undefined') {
      const newRoute =
        route === '/'
          ? this.#baseRoute
          : this.#baseRoute.replace(/\/$/, '') + route;

      window.history.pushState({}, '', newRoute);
      this.#onRouteChange?.(newRoute);
    }
  };

  #injectRoutingScript = () => {
    const iframeDoc = this.#iframe.contentDocument;
    if (!iframeDoc) return;

    // Check if script was already injected
    if (iframeDoc.getElementById('microapp-routing-script')) return;

    const script = iframeDoc.createElement('script');
    script.id = 'microapp-routing-script';
    script.textContent = `
      if (!window.__microappRoutingInitialized) {
        window.__microappRoutingInitialized = true;

        function notifyRouteChange(method) {
          const currentRoute = window.location.pathname;
          window.parent.postMessage({ type: '@microapp:routeChange', payload: { route: currentRoute, method }}, '*');
        }

        window.addEventListener('popstate', () => {
          notifyRouteChange('popstate');
        });

        const originalPushState = history.pushState;
        history.pushState = function(...args) {
          originalPushState.apply(this, args);
          notifyRouteChange('pushState');
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function(...args) {
          originalReplaceState.apply(this, args);
          notifyRouteChange('replaceState');
        };

        notifyRouteChange('init');
      }
    `;
    iframeDoc.head.appendChild(script);
  };
}
