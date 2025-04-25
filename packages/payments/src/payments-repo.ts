import type { MicroappAppSubscription } from '@microapp-io/runtime';

export type UserSubscribedCallback = (
  subscription: MicroappAppSubscription | null
) => void;
export type UnsubscribeCallback = () => void;

export interface PaymentsRepository {
  hasSubscription(): Promise<boolean>;

  getSubscription(): Promise<MicroappAppSubscription | null>;

  requireSubscription(): void;

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback;
}
