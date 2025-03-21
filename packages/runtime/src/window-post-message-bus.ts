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
  #targetOrigin: string;

  // NB: targetOrigin is required only for sending messages
  constructor({ targetOrigin }: { targetOrigin?: string } = {}) {
    this.#targetOrigin = targetOrigin ?? window.location.origin;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.trigger);
    }
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
      targetWindow.postMessage({ type, payload }, this.#targetOrigin);
    }
  };

  private trigger = (event: MessageEvent) => {
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
}
