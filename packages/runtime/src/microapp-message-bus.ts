import { WindowMessage, WindowPostMessageBus } from './window-post-message-bus';

export type MicroappMessageTypes =
  | WindowMessage<
      '@microapp:userPreferences',
      { theme?: string; lang?: string }
    >
  | WindowMessage<'@microapp:routeChange', { route: string }>;

export class MicroappMessageBus extends WindowPostMessageBus<MicroappMessageTypes> {
  constructor(options?: { targetOrigin: string }) {
    super(options);
  }
}
