import type {
  AuthRepo,
  UnsubscribeCallback,
  UserAuthenticatedCallback,
} from './auth-repo';
import type { User } from './user';
import type {
  MicroappMessagePayload,
  MicroappUser,
  MicroappUserAuthenticatedMessage,
} from '@microapp-io/runtime';
import {
  MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
  MicroappMessageBus,
} from '@microapp-io/runtime';
import { NoAuthenticatedUserError } from './errors';

export class MessageBusAuthRepo implements AuthRepo {
  private onUserAuthenticatedCallback: UserAuthenticatedCallback | null = null;
  private messageBus: MicroappMessageBus;
  private user: MicroappUser | null = null;

  constructor() {
    this.messageBus = new MicroappMessageBus();
    this.setupMessageListener();
  }

  private setupMessageListener() {
    this.messageBus.on(
      MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
      (
        userMessage: MicroappMessagePayload<MicroappUserAuthenticatedMessage>
      ) => {
        this.user = userMessage.user || null;
        this.onUserAuthenticatedCallback?.(this.user);
      }
    );
  }

  async isAuthenticated(): Promise<boolean> {
    return this.user !== null;
  }

  async getUser(): Promise<User> {
    if (!this.user) {
      throw new NoAuthenticatedUserError('Could not get user');
    }
    return this.user;
  }

  requestLogin(): void {
    this.messageBus.send(MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME, {});
  }

  onUserAuthenticated(
    callback: UserAuthenticatedCallback
  ): UnsubscribeCallback {
    this.onUserAuthenticatedCallback = callback;
    return () => {
      this.onUserAuthenticatedCallback = null;
    };
  }
}
