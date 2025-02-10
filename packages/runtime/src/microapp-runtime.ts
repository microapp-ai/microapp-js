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
  #theme: string = 'light';
  #lang: string = 'en';
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
    this.#theme = theme ?? this.#theme;
    this.#lang = lang ?? this.#lang;
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

  setIframeLang = (lang: string) => {
    this.#lang = lang;
    this.#updateUserPreferences();
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
        timestamp: Date.now(),
      },
    };

    this.#iframe.contentWindow?.postMessage(
      message,
      // PRODUCTION_MARKETPLACE_HOST_URL
      '*'
    );

    // this.#injectLangChangeScript();
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
          window.parent.postMessage({ type: '@microapp:routeChange', payload: { route: currentRoute }}, '*');
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

  #injectLangChangeScript = () => {
    const iframeDoc = this.#iframe.contentDocument;
    if (!iframeDoc || iframeDoc.getElementById('microapp-lang-script')) return;

    const script = iframeDoc.createElement('script');
    script.id = 'microapp-lang-script';
    script.textContent = `
      window.addEventListener('message', (event) => {
        if (event.data.type === '@microapp:userPreferences' && event.data.payload.lang) {
          if (window.next && window.next.router) {
            const currentPath = window.location.pathname;
            const newLocale = event.data.payload.lang;
            window.next.router.push(currentPath, currentPath, { locale: newLocale });
          }
        }
      });
    `;
    iframeDoc.head.appendChild(script);
  };
}
