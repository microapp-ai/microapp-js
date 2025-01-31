import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

export type UserPreferencesData = {
  theme?: string;
  lang?: string;
};

type MicroappRuntimeOptions = {
  iframeElement: HTMLIFrameElement;
  url: string;
  timeout?: number;
} & UserPreferencesData;

export class MicroappRuntime {
  #iframe: HTMLIFrameElement;
  #theme?: string;
  #lang?: string;

  constructor({
    iframeElement: iframe,
    url: src,
    theme,
    lang,
  }: MicroappRuntimeOptions) {
    this.#iframe = iframe;
    this.#theme = theme;
    this.#lang = lang;

    window.addEventListener('message', this.#onMessageEvent);

    // The iframe's src is assigned after the event listeners are initialized
    // to ensure we are ready to handle events when the microapp starts running
    this.#iframe.src = src;
  }

  destroy() {
    window.removeEventListener('message', this.#onMessageEvent);
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
    this.#iframe.style.setProperty('height', `${height}px`);
  };

  #getUserPreferences = () => {
    const message = {
      type: '@microapp:userpreferences',
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
}
