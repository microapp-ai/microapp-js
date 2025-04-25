import type {
  PaymentsRepository,
  UnsubscribeCallback,
  UserSubscribedCallback,
} from './payments-repo';
import type {
  MicroappAppSubscription,
  MicroappAppSubscriptionMessage,
  MicroappMessagePayload,
} from '@microapp-io/runtime';
import {
  MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
  MicroappMessageBus,
} from '@microapp-io/runtime';

export class MessageBusPaymentsRepo implements PaymentsRepository {
  private onUserSubscribedCallback: UserSubscribedCallback | null = null;
  private messageBus: MicroappMessageBus;
  private subscription: MicroappAppSubscription | null = null;

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
        this.subscription = userAppSubscription.appSubscription || null;
        this.onUserSubscribedCallback?.(this.subscription);
      }
    );
  }

  async hasSubscription(): Promise<boolean> {
    return this.subscription !== null;
  }

  async getSubscription(): Promise<MicroappAppSubscription | null> {
    const payload = await this.messageBus.request(
      MICROAPP_REQUEST_USER_APP_SUBSCRIPTION_EVENT_NAME,
      MICROAPP_USER_APP_SUBSCRIPTION_EVENT_NAME,
      {}
    );

    const { appSubscription } =
      payload as MicroappMessagePayload<MicroappAppSubscriptionMessage>;

    this.subscription = appSubscription || null;
    this.onUserSubscribedCallback?.(this.subscription);

    return this.subscription;
  }

  requireSubscription(): void {
    this.messageBus.send(MICROAPP_REQUIRE_USER_APP_SUBSCRIPTION_EVENT_NAME, {});
  }

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback {
    this.onUserSubscribedCallback = callback;
    return () => {
      this.onUserSubscribedCallback = null;
    };
  }
}
