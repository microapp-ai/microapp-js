import { SandboxPaymentsRepo, SubscriptionPlanCycle } from '../src';

describe('SandboxPaymentsRepo', () => {
  it('does not have subscription until requested', async () => {
    const repo = new SandboxPaymentsRepo({
      enabled: true,
      subscription: () => ({
        id: 'some-subscription',
        createdAt: new Date(),
        subscriptionPlan: {
          id: 'some-subscription-plan',
          name: 'free',
          priceInCents: 0,
          cycle: SubscriptionPlanCycle.ONE_TIME,
        },
      }),
    });

    let hasSubscription = await repo.hasSubscription();
    expect(hasSubscription).toBe(false);

    await expect(repo.getSubscription()).rejects.toThrow(
      'Could not get subscription'
    );

    await repo.requestSubscription();

    hasSubscription = await repo.hasSubscription();
    expect(hasSubscription).toBe(true);

    const subscription = await repo.getSubscription();
    expect(subscription.id).toBe('some-subscription');
    expect(subscription.subscriptionPlan.name).toBe('free');
    expect(subscription.subscriptionPlan.priceInCents).toBe(0);
    expect(subscription.subscriptionPlan.cycle).toBe(
      SubscriptionPlanCycle.ONE_TIME
    );
  });

  it('returns provided subscription', async () => {
    const repo = new SandboxPaymentsRepo({
      enabled: true,
      subscription: {
        id: 'some-subscription',
        createdAt: new Date(),
        subscriptionPlan: {
          id: 'some-subscription-plan',
          name: 'free',
          priceInCents: 0,
          cycle: SubscriptionPlanCycle.ONE_TIME,
        },
      },
    });

    const hasSubscription = await repo.hasSubscription();
    expect(hasSubscription).toBe(true);

    const subscription = await repo.getSubscription();
    expect(subscription.id).toBe('some-subscription');
    expect(subscription.subscriptionPlan.name).toBe('free');
    expect(subscription.subscriptionPlan.priceInCents).toBe(0);
    expect(subscription.subscriptionPlan.cycle).toBe(
      SubscriptionPlanCycle.ONE_TIME
    );
  });

  it('executes callback when user is subscribed', async () => {
    const createdAt = new Date();

    const repo = new SandboxPaymentsRepo({
      enabled: true,
      subscription: () => ({
        id: 'some-subscription',
        createdAt: createdAt,
        subscriptionPlan: {
          id: 'some-subscription-plan',
          name: 'free',
          priceInCents: 0,
          cycle: SubscriptionPlanCycle.ONE_TIME,
        },
      }),
    });

    const mockCallback = jest.fn();
    const unsubscribeCallback = repo.onUserSubscribed(mockCallback);

    await repo.requestSubscription();

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'some-subscription',
        createdAt: createdAt,
        subscriptionPlan: {
          id: 'some-subscription-plan',
          name: 'free',
          priceInCents: 0,
          cycle: SubscriptionPlanCycle.ONE_TIME,
        },
      })
    );

    unsubscribeCallback();

    await repo.requestSubscription();

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
