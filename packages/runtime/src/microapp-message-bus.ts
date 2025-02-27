import { WindowPostMessageBus } from './window-post-message-bus';
import type { MicroappMessages } from './types';

export class MicroappMessageBus extends WindowPostMessageBus<MicroappMessages> {}
