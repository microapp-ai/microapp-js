import type {
  UserPreferencesRepo,
  UserPreferencesUpdateCallback,
} from './user-preferences-repo';
import { MessageBusUserPreferencesRepo } from './message-bus-user-preferences-repo';
import type { SandboxUserPreferencesRepoOptions } from './sandbox-user-preferences-repo';
import { SandboxUserPreferencesRepo } from './sandbox-user-preferences-repo';
import { DEFAULT_MICROAPP_USER_PREFERENCES } from './constants';
import type {
  MicroappMessagePayload,
  MicroappUserPreferencesMessage,
} from '@microapp-io/runtime';

export class UserPreferences {
  #repo: UserPreferencesRepo;

  constructor(
    options: {
      sandbox?: SandboxUserPreferencesRepoOptions;
    } = {}
  ) {
    this.#repo = options.sandbox
      ? new SandboxUserPreferencesRepo(options.sandbox)
      : new MessageBusUserPreferencesRepo();
  }

  getPreferences(): MicroappMessagePayload<MicroappUserPreferencesMessage> {
    return this.#repo.getPreferences() ?? DEFAULT_MICROAPP_USER_PREFERENCES;
  }

  onUpdate(callback: UserPreferencesUpdateCallback): () => void {
    return this.#repo.onUpdate(callback);
  }
}
