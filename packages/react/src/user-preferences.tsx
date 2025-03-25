import type { PropsWithChildren } from 'react';
import * as React from 'react';
import type { SandboxUserPreferencesRepoOptions } from '@microapp-io/user-preferences';
import { UserPreferences } from '@microapp-io/user-preferences';
import type {
  MicroappLanguage,
  MicroappMessagePayload,
  MicroappTheme,
  MicroappUserPreferencesMessage,
} from '@microapp-io/runtime';

type UserPreferencesContextType = {
  preferences: MicroappMessagePayload<MicroappUserPreferencesMessage>;
};

const UserPreferencesContext = React.createContext<
  UserPreferencesContextType | undefined
>(undefined);

export const useUserPreferences = (): UserPreferencesContextType => {
  const context = React.useContext(UserPreferencesContext);

  if (!context) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider'
    );
  }

  return context;
};

type UseThemeOptions = {
  onChange?: (theme: MicroappTheme) => void;
};

export const useTheme = (options?: UseThemeOptions): MicroappTheme => {
  const { preferences } = useUserPreferences();

  React.useEffect(() => {
    if (options?.onChange) {
      options.onChange(preferences.theme!);
    }
  }, [preferences.theme, options]);

  return preferences.theme!;
};

type UseLangOptions = {
  onChange?: (lang: MicroappLanguage) => void;
};

export const useLang = (options?: UseLangOptions): MicroappLanguage => {
  const { preferences } = useUserPreferences();

  React.useEffect(() => {
    if (options?.onChange) {
      options.onChange(preferences.lang!);
    }
  }, [preferences.lang, options]);

  return preferences.lang!;
};

type UserPreferencesProviderProps = PropsWithChildren<{
  sandbox?: SandboxUserPreferencesRepoOptions;
}>;

export const UserPreferencesProvider: React.FC<
  UserPreferencesProviderProps
> = ({ sandbox, children }) => {
  const userPreferences = React.useMemo(
    () => new UserPreferences({ sandbox }),
    [sandbox]
  );

  const preferences = React.useSyncExternalStore(
    (onChange) => userPreferences.onUpdate(onChange),
    () => userPreferences.getPreferences()
  );

  return (
    <UserPreferencesContext.Provider value={{ preferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
