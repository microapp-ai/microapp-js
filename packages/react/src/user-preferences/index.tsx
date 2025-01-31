import * as React from 'react';
import type { PropsWithChildren } from 'react';
import type { UserPreferencesData } from './user-preferences';
import {
  type UserPreferencesOptions,
  createUserPreferences,
} from './create-user-preferences';

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
  options,
  children,
}: PropsWithChildren<{ options: UserPreferencesOptions }>) => {
  const userPreferences = React.useMemo(
    () => createUserPreferences(options),
    [options]
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
