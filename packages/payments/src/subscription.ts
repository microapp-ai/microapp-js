export enum SubscriptionPlanCycle {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export type SubscriptionPlan = {
  id: string;
  name?: string;
  priceInCents?: number;
  cycle?: SubscriptionPlanCycle;
};

export type UserSubscription = {
  id: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
};
