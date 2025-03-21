import type {UserSubscription} from "./subscription";
import type {SandboxPaymentsOptions} from "./sandbox-payments-repo";
import { SandboxPaymentsRepo} from "./sandbox-payments-repo";
import type { PaymentsConfigParams} from "./payments-config";
import {PaymentsConfig} from "./payments-config";
import type {PaymentsRepository, UnsubscribeCallback, UserSubscribedCallback} from "./payments-repo";
import {HttpPaymentsRepo} from "./http-payments-repo";
import {invariant} from "./utils";

export type PaymentsOptions = {
  config?: Partial<PaymentsConfigParams>;
  sandbox?: SandboxPaymentsOptions;
};

export class Payments {
  readonly config: PaymentsConfig;
  private readonly repo: PaymentsRepository;

  constructor({ config, sandbox }: PaymentsOptions = {}) {
    this.config = new PaymentsConfig(config);
    this.repo = new HttpPaymentsRepo(this.config);

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

  async getSubscription(): Promise<UserSubscription | null> {
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