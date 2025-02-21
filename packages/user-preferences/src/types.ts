export type UserPreferencesData = {
  theme?: string;
  lang?: string;
};

export type UserPreferencesOptions = {
  sandbox?: UserPreferencesData;
};

export type SandboxPreferencesOptions = UserPreferencesData;
