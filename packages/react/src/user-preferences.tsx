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

type UserPreferencesContextType =
  MicroappMessagePayload<MicroappUserPreferencesMessage>;

const UserPreferencesContext = React.createContext<
  UserPreferencesContextType | undefined
>(undefined);

export const useUserPreferences = (): UserPreferencesContextType => {
  const context = React.useContext(UserPreferencesContext);

  if (!context) {
    throw new Error(
      '[@microapp-io/react] useUserPreferences must be used within a UserPreferencesProvider'
    );
  }

  return context;
};

type UseThemeOptions = {
  onChange?: (theme: MicroappTheme) => void;
};

export const useTheme = ({ onChange }: UseThemeOptions = {}): MicroappTheme => {
  const { theme } = useUserPreferences();

  React.useEffect(() => {
    if (onChange) {
      onChange(theme);
    }
  }, [theme, onChange]);

  return theme;
};

type UseLangOptions = {
  onChange?: (lang: MicroappLanguage) => void;
};

export const useLang = ({
  onChange,
}: UseLangOptions = {}): MicroappLanguage => {
  const { lang } = useUserPreferences();

  React.useEffect(() => {
    if (onChange) {
      onChange(lang);
    }
  }, [lang, onChange]);

  return lang;
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

  const [preferences, setPreferences] = React.useState(
    userPreferences.getPreferences()
  );

  React.useEffect(() => {
    return userPreferences.onUpdate((newPreferences) => {
      setPreferences(newPreferences);
    });
  }, [userPreferences]);

  return (
    <UserPreferencesContext.Provider value={preferences}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
