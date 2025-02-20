import * as React from 'react';
import { UserPreferences } from '@microapp-io/user-preferences';
import type { UserPreferencesData } from '@microapp-io/user-preferences';

type UserPreferencesContextValue = {
  preferences?: UserPreferencesData;
};

const UserPreferencesContext = React.createContext<
  UserPreferencesContextValue | undefined
>(undefined);

export const useUserPreferences = (): UserPreferencesContextValue => {
  const context = React.useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider'
    );
  }

  return context;
};

export const useTheme = () => useUserPreferences().preferences?.theme;
export const useLang = () => useUserPreferences().preferences?.lang;

export const UserPreferencesProvider = ({
  sandbox,
  children,
}: {
  sandbox?: UserPreferencesData;
  children: React.ReactNode;
}) => {
  const userPreferences = React.useMemo(() => {
    return Object.keys(sandbox || {}).length > 0
      ? new UserPreferences({ sandbox })
      : new UserPreferences();
  }, [sandbox]);

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
