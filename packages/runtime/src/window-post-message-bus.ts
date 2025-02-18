import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

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

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.trigger);
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.trigger);
    }
    this.#handlers.clear();
  }

  on<TType extends TMessage['type']>(
    type: TType,
    handler: (payload: ExtractPayload<TMessage, TType>) => void
  ): () => void {
    if (!this.#handlers.has(type)) {
      this.#handlers.set(type, new Set());
    }
    this.#handlers.get(type)!.add(handler);

    return () => {
      this.#handlers.get(type)?.delete(handler);
    };
  }

  trigger = (event: MessageEvent) => {
    const { type, payload } = event.data as TMessage;
    const handlers = this.#handlers.get(type);

    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  };

  send<TType extends TMessage['type']>(
    type: TType,
    payload: ExtractPayload<TMessage, TType>,
    target?: Window
  ) {
    if (typeof window !== 'undefined') {
      const targetWindow = target || window.parent;
      targetWindow.postMessage(
        { type, payload },
        PRODUCTION_MARKETPLACE_HOST_URL
      );
    }
  }
}
