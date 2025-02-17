type MessageHandler<T = unknown> = (payload: T) => void;
type MessageType = '@microapp:userPreferences' | '@microapp:routeChange';
import { PRODUCTION_MARKETPLACE_HOST_URL } from './constants';

interface Message<T = unknown> {
  type: MessageType;
  payload: T;
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

  on<T>(type: MessageType, handler: MessageHandler<T>): () => void {
    if (!this.#handlers.has(type)) {
      this.#handlers.set(type, new Set());
    }
    this.#handlers.get(type)!.add(handler as MessageHandler);

    return () => {
      this.#handlers.get(type)?.delete(handler as MessageHandler);
    };
  }

  sendUserPreferences = (
    payload: { theme?: string; lang?: string },
    target?: Window
  ) => {
    this.#send({ type: '@microapp:userPreferences', payload }, target);
  };

  sendRouteChange = (route: string, target?: Window) => {
    this.#send({ type: '@microapp:routeChange', payload: { route } }, target);
  };

  #send<T>(message: Message<T>, target?: Window) {
    if (typeof window !== 'undefined') {
      const targetWindow = target || window.parent;
      targetWindow.postMessage(message, PRODUCTION_MARKETPLACE_HOST_URL);
    }
  }

  #handleMessage = (event: MessageEvent) => {
    const { type, payload } = event.data as Message;
    const handlers = this.#handlers.get(type);

    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  };
}
