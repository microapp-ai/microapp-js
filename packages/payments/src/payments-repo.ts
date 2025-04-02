import type { UserSubscription } from './subscription';

export type UserSubscribedCallback = (
  subscription: UserSubscription | null
) => void;
export type UnsubscribeCallback = () => void;

export interface PaymentsRepository {
  hasSubscription(): Promise<boolean>;

  getSubscription(): Promise<UserSubscription | null>;

  requestSubscription(): void;

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback;
}
