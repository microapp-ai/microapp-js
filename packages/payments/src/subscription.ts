export enum SubscriptionPlanCycle {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export type SubscriptionPlan = {
  id: string;
  name?: string;
  description?: string;
  priceInCents?: number;
  cycle?: SubscriptionPlanCycle;
  features?: SubscriptionPlanFeature[]
};

export type SubscriptionPlanFeature = {
  id: string;
  name: string;
  description?: string;
}

export type UserSubscription = {
  id: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
};
