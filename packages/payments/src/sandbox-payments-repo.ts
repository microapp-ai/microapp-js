import type {PaymentsRepository, UnsubscribeCallback, UserSubscribedCallback} from "./payments-repo";
import type { UserSubscription } from "./subscription";
import {NoSubscriptionError} from "./errors";
import {invariant, isProduction, warning} from "./utils";

export type SandboxPaymentsOptions =
  | boolean
  | {
  enabled?: boolean;
  subscription: UserSubscription | null | (() => UserSubscription | null) | (() => Promise<UserSubscription | null>);
};

export class SandboxPaymentsRepo implements PaymentsRepository {
  private readonly enabled: boolean;
  private readonly _getSubscription: () => Promise<UserSubscription | null>;
  private internalSubscription: UserSubscription | null = null;
  private onUserSubscribedCallback: UserSubscribedCallback | null = null;

  static isEnabled(options?: SandboxPaymentsOptions): boolean {
    if (!options) {
      return false;
    }

    const { enabled } = SandboxPaymentsRepo.parseOptions(options);
    return enabled;
  }

  static parseOptions(options: SandboxPaymentsOptions): {
    enabled: boolean;
    getSubscription: () => Promise<UserSubscription | null>;
    subscription: UserSubscription | null;
  } {
    if (typeof options === 'boolean') {
      return { enabled: options, getSubscription: async () => null, subscription: null };
    }

    const { enabled = true, subscription } = options;
    return {
      enabled,
      getSubscription:
        typeof subscription === 'function' ? async () => subscription() : async () => subscription,
      subscription:
        typeof subscription === 'function' ? null : subscription,
    };
  }

  constructor(options: SandboxPaymentsOptions) {
    const { enabled, getSubscription, subscription } = SandboxPaymentsRepo.parseOptions(options);
    this.enabled = enabled;
    this._getSubscription = getSubscription;
    this.internalSubscription = subscription;

    warning(
      isProduction() && enabled,
      '[@microapp-io/payments] Sandbox payments should not be used in production.\nCheck the documentation for more information: https://docs.microapp.io/payments/introduction'
    );
  }

  private throwIfNotEnabled(): void {
    invariant(this.enabled, 'Sandbox payments is not enabled');
  }

  async hasSubscription(): Promise<boolean> {
    this.throwIfNotEnabled();
    if (this.internalSubscription === null) {
      return false;
    }
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  async getSubscription(): Promise<UserSubscription | null> {
    this.throwIfNotEnabled();
    if (this.internalSubscription === null) {
      (this.onUserSubscribedCallback)?.(null);
      throw new NoSubscriptionError('Could not get subscription');
    }

    return this.internalSubscription;
  }

  async requestSubscription(): Promise<void> {
    this.internalSubscription = await this._getSubscription();
    if (this.internalSubscription) {
      (this.onUserSubscribedCallback)?.(this.internalSubscription);
    }
  }

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback {
    this.onUserSubscribedCallback = callback;
    return () => {
      this.onUserSubscribedCallback = null;
    }
  }
}