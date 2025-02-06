// import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

type MicroappRuntimeOptions = {
  iframeElement: HTMLIFrameElement;
  url: string;
  timeout?: number;
};

export class MicroappRuntime {
  static create(
    container: HTMLElement,
    options: { url: string }
  ): MicroappRuntime {
    const iframe = document.createElement('iframe');
    container.appendChild(iframe);

    return new MicroappRuntime({
      iframeElement: iframe,
      url: options.url,
    });
  }

  #iframe: HTMLIFrameElement;
  // #theme?: string;
  // #lang?: string;

  constructor({ iframeElement: iframe, url: src }: MicroappRuntimeOptions) {
    this.#iframe = iframe;
    window.addEventListener('message', this.#onMessageEvent);
    window.addEventListener('resize', this.setIframeDimensions);

    this.#iframe.src = src;
  }

  destroy() {
    window.removeEventListener('message', this.#onMessageEvent);
    window.removeEventListener('resize', this.setIframeDimensions);
    // this.#iframe.removeEventListener('load', this.#injectResizeScript);
  }

  #onMessageEvent = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
      case '@microapp:setHeight':
        return this.#onSetIframeHeight(payload);
      case '@microapp:getUserPreferences':
        return this.#getUserPreferences();
      default:
        return;
    }
  };

  #onSetIframeHeight = (height: number) => {
    console.log({ height });
    if (height > 0) {
      this.#iframe.style.setProperty('height', `${height}px`);
    }
  };

  setIframeDimensions = () => {
    const parentElement = this.#iframe.parentElement;
    if (parentElement) {
      const { width, height } = parentElement.getBoundingClientRect();
      console.log({ parentElement, width, height });
      this.#iframe.style.width = `${width}px`;
      this.#iframe.style.height = `${height}px`;
    }
  };

  #getUserPreferences = () => {
    const message = {
      type: '@microapp:userpreferences',
      payload: {
        // theme: this.#theme,
        // lang: this.#lang,
      },
    };

    this.#iframe.contentWindow?.postMessage(
      message
      // PRODUCTION_MARKETPLACE_HOST_URL
    );
  };
}
