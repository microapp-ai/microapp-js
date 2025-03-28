import { ALLOWED_MICROAPP_ORIGIN_HOSTNAMES } from './constants';

export type WindowMessage<
  TType extends string,
  TPayload extends Record<string, unknown>
> = {
  type: TType;
  payload: TPayload;
};

type ExtractPayload<TMessage, TType> = TMessage extends {
  type: TType;
  payload: infer TPayload;
}
  ? TPayload
  : never;

export class WindowPostMessageBus<
  TMessage extends WindowMessage<string, Record<string, unknown>>
> {
  #handlers: Map<string, Set<(payload: any) => void>> = new Map();
  #targetOrigin?: string;

  // NB: targetOrigin is required only for sending messages
  constructor({ targetOrigin }: { targetOrigin?: string } = {}) {
    this.#targetOrigin = targetOrigin;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.trigger);
    }
  }

  set targetOrigin(targetOrigin: string) {
    this.#targetOrigin = targetOrigin;
  }

  on = <TType extends TMessage['type']>(
    type: TType,
    handler: (payload: ExtractPayload<TMessage, TType>) => void
  ): (() => void) => {
    if (!this.#handlers.has(type)) {
      this.#handlers.set(type, new Set());
    }

    this.#handlers.get(type)!.add(handler);

    return () => {
      this.#handlers.get(type)?.delete(handler);
    };
  };

  send = <TType extends TMessage['type']>(
    type: TType,
    payload: ExtractPayload<TMessage, TType>,
    target?: Window
  ) => {
    if (typeof window !== 'undefined') {
      const targetWindow = target || window.parent;
      targetWindow.postMessage({ type, payload }, this.#targetOrigin || '*');
    }
  };

  private trigger = (event: MessageEvent) => {
    if (!this.#isEventOriginAllowed(event.origin)) {
      return;
    }

    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    const message = event.data as Partial<TMessage>;
    if (!message.type || !message.payload) {
      return;
    }

    const handlers = this.#handlers.get(message.type);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => handler(message.payload));
  };

  #isEventOriginAllowed(origin: string): boolean {
    if (this.#targetOrigin) {
      return origin === this.#targetOrigin;
    }

    // NB: This is a temporary solution to allow microapps to communicate with the host
    return (
      ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.find((allowedOriginHostname) => {
        const eventOriginUrl = new URL(origin);
        return allowedOriginHostname === eventOriginUrl.hostname;
      }) !== undefined
    );
  }
}
