import type {
  AuthRepo,
  UnsubscribeCallback,
  UserAuthenticatedCallback,
} from './auth-repo';
import type { User } from './user';
import { invariant } from './utils';
import {
  MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME,
  MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
  MicroappMessageBus,
  MicroappMessagePayload,
  MicroappUser,
  MicroappUserAuthenticatedMessage,
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
    const user = this.getMicroappUser();

    return user !== null;
  }

  async getUser(): Promise<User> {
    const user = await this.getMicroappUser();

    if (user === null) {
      this.onUserAuthenticatedCallback?.(null);
      throw new NoAuthenticatedUserError('Could not get user');
    }

    return user;
  }

  requestLogin(): void {
    invariant(
      typeof window !== 'undefined',
      'requestLogin can only be used in the browser'
    );

    this.messageBus.send(MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME, {});
  }

  onUserAuthenticated(
    callback: UserAuthenticatedCallback
  ): UnsubscribeCallback {
    this.onUserAuthenticatedCallback = callback;
    return () => {
      this.onUserAuthenticatedCallback = null;
    };
  }

  private async getMicroappUser(): Promise<MicroappUser | null> {
    try {
      const microappUserMessage = await this.messageBus.request({
        requestType: MICROAPP_REQUEST_USER_AUTHENTICATED_EVENT_NAME,
        responseType: MICROAPP_USER_AUTHENTICATED_EVENT_NAME,
        payload: {},
      });

      return microappUserMessage.user ?? null;
    } catch (error) {
      console.error('[@microapp-io/auth] Failed to get user:', error);
      return null;
    }
  }
}
