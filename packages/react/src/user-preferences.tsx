import type { PropsWithChildren } from 'react';
import * as React from 'react';
import type { SandboxUserPreferencesRepoOptions } from '@microapp-io/user-preferences';
import { UserPreferences } from '@microapp-io/user-preferences';
import type {
  MicroappLanguage,
  MicroappTheme,
  MicroappUserPreferencesMessagePayload,
} from '@microapp-io/runtime';

type UserPreferencesContextType = {
  preferences: MicroappUserPreferencesMessagePayload;
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

export const useTheme = (): MicroappTheme => {
  const { preferences } = useUserPreferences();
  return preferences.theme!;
};

export const useLang = (): MicroappLanguage => {
  const { preferences } = useUserPreferences();
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
