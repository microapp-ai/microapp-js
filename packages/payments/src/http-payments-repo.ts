import type {
  PaymentsRepository,
  UnsubscribeCallback,
  UserSubscribedCallback,
} from './payments-repo';
import type {
  SubscriptionPlan,
  SubscriptionPlanCycle,
  UserSubscription,
} from './subscription';
import type { PaymentsConfig } from './payments-config';
import { invariant } from './utils';
import { MissingGlobalVariableError } from './errors';

export class HttpPaymentsRepo implements PaymentsRepository {
  private onUserSubscribedCallback: UserSubscribedCallback | null = null;

  constructor(private config: PaymentsConfig) {}

  async hasSubscription(): Promise<boolean> {
    const userSubscription = this.getUserSubscription();

    return userSubscription !== null;
  }

  async getSubscription(): Promise<UserSubscription | null> {
    const userSubscription = await this.getUserSubscription();

    if (userSubscription === null) {
      this.onUserSubscribedCallback?.(null);
      return null;
    }

    const subscriptionPlanDetails = await this.getSubscriptionPlanDetails(
      userSubscription.subscriptionPlan.id
    );

    return {
      id: userSubscription.id,
      subscriptionPlan: subscriptionPlanDetails,
      createdAt: userSubscription.createdAt,
    };
  }

  buildSubscriptionPageUrl(): string {
    const appId = this.getAppIdOrThrow();

    return this.config.buildUrl({
      //TODO: replace here with the correct url
      path: `/marketplace/${appId}/plans`,
    });
  }

  requestSubscription(): void {
    invariant(
      typeof window !== 'undefined',
      'requestSubscription can only be used in the browser'
    );

    window.location.href = this.buildSubscriptionPageUrl();
  }

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback {
    this.onUserSubscribedCallback = callback;
    return () => {
      this.onUserSubscribedCallback = null;
    };
  }

  private async getUserSubscription(): Promise<UserSubscription | null> {
    const appId = this.getAppIdOrThrow();

    const getUserSubscriptionUrl = this.config.buildUrl({
      path: `/apps/${appId}/user-subscriptions`,
    });

    const response = await fetch(getUserSubscriptionUrl);

    if (response.status !== 200) {
      this.onUserSubscribedCallback?.(null);
      return null;
    }

    const userSubscription = await response.json();

    return {
      id: userSubscription.id,
      createdAt: userSubscription.createdAt,
      subscriptionPlan: {
        id: userSubscription.subscriptionPlanId,
      },
    };
  }

  private async getSubscriptionPlanDetails(
    subscriptionPlanId: string
  ): Promise<SubscriptionPlan> {
    const appId = this.getAppIdOrThrow();

    const getSubscriptionPlanDetailsUrl = this.config.buildUrl({
      path: `/apps/${appId}/plans/${subscriptionPlanId}`,
    });

    const response = await fetch(getSubscriptionPlanDetailsUrl);

    if (response.status !== 200) {
      invariant(
        response.status === 200,
        'Could not get subscription plan details'
      );
    }

    const subscriptionPlan = await response.json();

    return {
      id: subscriptionPlan.id,
      name: subscriptionPlan.name,
      description: subscriptionPlan.description,
      priceInCents: subscriptionPlan.priceInCents,
      cycle: subscriptionPlan.cycle as SubscriptionPlanCycle,
      features: subscriptionPlan.features?.map(
        (feature: { id: string; name: string; description?: string }) => {
          return {
            id: feature.id,
            name: feature.name,
            description: feature.description,
          };
        }
      ),
    };
  }

  private getAppIdOrThrow(): string | null {
    const id =
      '__MICROAPP__' in window && !!window.__MICROAPP__.id
        ? window.__MICROAPP__.id
        : null;

    if (!id) {
      throw new MissingGlobalVariableError('__MICROAPP__ must be defined');
    }

    return id;
  }
}
