import type {
  PaymentsRepository,
  UnsubscribeCallback,
  UserSubscribedCallback,
} from './payments-repo';
import { invariant } from './utils';
import {
  MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MicroappAppSubscription,
  MicroappAppSubscriptionMessage,
  MicroappMessageBus,
  MicroappMessagePayload,
} from '@microapp-io/runtime';

export class MessageBusPaymentsRepo implements PaymentsRepository {
  private onUserSubscribedCallback: UserSubscribedCallback | null = null;
  private messageBus: MicroappMessageBus;
  private userSubscription: MicroappAppSubscription | null = null;

  constructor() {
    this.messageBus = new MicroappMessageBus();
    this.setupMessageListener();
  }

  private setupMessageListener() {
    this.messageBus.on(
      MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
      (
        userAppSubscription: MicroappMessagePayload<MicroappAppSubscriptionMessage>
      ) => {
        this.userSubscription = userAppSubscription.appSubscription || null;
        this.onUserSubscribedCallback?.(this.userSubscription);
      }
    );
  }

  async hasSubscription(): Promise<boolean> {
    const userSubscription = this.getUserSubscription();

    return userSubscription !== null;
  }

  async getSubscription(): Promise<MicroappAppSubscription | null> {
    const userSubscription = await this.getUserSubscription();

    if (userSubscription === null) {
      this.onUserSubscribedCallback?.(null);
      return null;
    }

    return userSubscription;
  }

  requestSubscription(): void {
    invariant(
      typeof window !== 'undefined',
      'requestSubscription can only be used in the browser'
    );

    this.messageBus.send(MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME, {});
  }

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback {
    this.onUserSubscribedCallback = callback;
    return () => {
      this.onUserSubscribedCallback = null;
    };
  }

  private async getUserSubscription(): Promise<MicroappAppSubscription | null> {
    try {
      const userSubscription = await this.messageBus.request({
        requestType: MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
        responseType: MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
        payload: {},
      });

      return userSubscription.appSubscription ?? null;
    } catch (error) {
      console.error(
        '[@microapp-io/payments] Failed to get user subscription:',
        error
      );
      return null;
    }
  }
}
