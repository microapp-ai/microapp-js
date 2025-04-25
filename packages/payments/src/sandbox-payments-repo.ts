import type {
  PaymentsRepository,
  UnsubscribeCallback,
  UserSubscribedCallback,
} from './payments-repo';
import { NoSubscriptionError } from './errors';
import { invariant, isProduction, warning } from './utils';
import type { MicroappAppSubscription } from '@microapp-io/runtime';

export type SandboxPaymentsOptions =
  | boolean
  | {
      enabled?: boolean;
      subscription:
        | MicroappAppSubscription
        | null
        | (() => MicroappAppSubscription | null)
        | (() => Promise<MicroappAppSubscription | null>);
    };

export class SandboxPaymentsRepo implements PaymentsRepository {
  private readonly enabled: boolean;
  private readonly _getSubscription: () => Promise<MicroappAppSubscription | null>;
  private subscription: MicroappAppSubscription | null = null;
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
    getSubscription: () => Promise<MicroappAppSubscription | null>;
  } {
    if (typeof options === 'boolean') {
      return { enabled: options, getSubscription: async () => null };
    }

    const { enabled = true, subscription } = options;
    return {
      enabled,
      getSubscription: async () => {
        if (typeof subscription === 'function') {
          return subscription();
        }
        return subscription;
      },
    };
  }

  constructor(options: SandboxPaymentsOptions) {
    const { enabled, getSubscription } =
      SandboxPaymentsRepo.parseOptions(options);

    this.enabled = enabled;
    this._getSubscription = getSubscription;

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
    return this.subscription !== null;
  }

  async getSubscription(): Promise<MicroappAppSubscription | null> {
    this.throwIfNotEnabled();
    await this.requireSubscription();
    if (this.subscription === null) {
      throw new NoSubscriptionError('Could not get subscription');
    }
    return this.subscription;
  }

  async requireSubscription(): Promise<void> {
    this.subscription = await this._getSubscription();
    this.onUserSubscribedCallback?.(this.subscription);
  }

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback {
    this.onUserSubscribedCallback = callback;
    return () => {
      this.onUserSubscribedCallback = null;
    };
  }
}
