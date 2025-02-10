import {
  type SandboxPreferencesOptions,
  SandboxUserPreferences,
} from './sandbox-user-preferences';
import { UserPreferences } from './user-preferences';

export type UserPreferencesOptions = {
  sandbox?: SandboxPreferencesOptions;
};

export function createUserPreferences(
  options: UserPreferencesOptions = {}
): UserPreferences {
  if (SandboxUserPreferences.isEnabled(options.sandbox)) {
    return new SandboxUserPreferences(options.sandbox!);
  }

  return new UserPreferences();
}
