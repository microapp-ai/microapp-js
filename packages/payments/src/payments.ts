import type { SandboxPaymentsOptions } from './sandbox-payments-repo';
import { SandboxPaymentsRepo } from './sandbox-payments-repo';
import type {
  PaymentsRepository,
  UnsubscribeCallback,
  UserSubscribedCallback,
} from './payments-repo';
import { invariant } from './utils';
import { MicroappAppSubscription } from '@microapp-io/runtime';
import { MessageBusPaymentsRepo } from './message-bus-payments-repo';

export type PaymentsOptions = {
  sandbox?: SandboxPaymentsOptions;
};

export class Payments {
  private readonly repo: PaymentsRepository;

  constructor({ sandbox }: PaymentsOptions = {}) {
    this.repo = new MessageBusPaymentsRepo();

    const isSandboxEnabled = sandbox
      ? SandboxPaymentsRepo.isEnabled(sandbox)
      : false;

    if (isSandboxEnabled) {
      this.repo = new SandboxPaymentsRepo(sandbox!);
    }
  }

  async hasSubscription(): Promise<boolean> {
    return this.repo.hasSubscription();
  }

  async getSubscription(): Promise<MicroappAppSubscription | null> {
    return this.repo.getSubscription();
  }

  requestSubscription(): void {
    invariant(
      typeof window !== 'undefined',
      'requestSubscription can only be used in the browser'
    );

    this.repo.requestSubscription();
  }

  onUserSubscribed(callback: UserSubscribedCallback): UnsubscribeCallback {
    return this.repo.onUserSubscribed(callback);
  }
}
