import { WindowMessage, WindowPostMessageBus } from './window-post-message-bus';

export type MicroappMessageTypes =
  | WindowMessage<
      '@microapp:userPreferences',
      { theme?: string; lang?: string }
    >
  | WindowMessage<'@microapp:routeChange', { route: string }>
  | WindowMessage<'@microapp:resize', { height: number }>;

export class MicroappMessageBus extends WindowPostMessageBus<MicroappMessageTypes> {}
