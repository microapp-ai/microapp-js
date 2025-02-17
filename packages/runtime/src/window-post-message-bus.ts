import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

type MessageHandler<T = unknown> = (payload: T) => void;
export type MessageType = '@microapp:userPreferences' | '@microapp:routeChange';

type MessagePayloadMap = {
  '@microapp:userPreferences': {
    type: '@microapp:userPreferences';
    theme?: string;
    lang?: string;
  };
  '@microapp:routeChange': {
    type: '@microapp:routeChange';
    route: string;
  };
};

interface Message<T extends MessageType = MessageType> {
  payload: MessagePayloadMap[T];
}

export class WindowPostMessageBus {
  #handlers: Map<MessageType, Set<MessageHandler>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.#handleMessage);
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.#handleMessage);
    }
    this.#handlers.clear();
  }

  on<T extends MessageType>(
    type: T,
    handler: MessageHandler<MessagePayloadMap[T]>
  ): () => void {
    if (!this.#handlers.has(type)) {
      this.#handlers.set(type, new Set());
    }
    this.#handlers.get(type)!.add(handler as MessageHandler);

    return () => {
      this.#handlers.get(type)?.delete(handler as MessageHandler);
    };
  }

  send<T extends MessageType>(
    payload: MessagePayloadMap[T] | { payload: MessagePayloadMap[T] },
    target?: Window
  ) {
    if (typeof window !== 'undefined') {
      const targetWindow = target || window.parent;
      const message = 'payload' in payload ? payload : { payload };
      targetWindow.postMessage(message, PRODUCTION_MARKETPLACE_HOST_URL);
    }
  }

  #handleMessage = (event: MessageEvent) => {
    const { payload } = event.data as Message;
    const handlers = this.#handlers.get(payload.type);

    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  };
}
