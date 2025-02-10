import * as React from 'react';
import type {
  AuthOptions,
  AuthRepoBuildLoginUrlParams,
  User,
} from '@microapp-io/auth';
import { Auth } from '@microapp-io/auth';

export type AuthContextType =
  | {
      isAuthenticated: false;
      isLoading: boolean;
      error?: Error;
      user?: undefined;
      refresh: () => void;
      requestLogin: () => void;
      buildLoginUrl: (params?: { returnTo?: string }) => string;
    }
  | {
      isAuthenticated: true;
      isLoading: boolean;
      error?: Error;
      user: User;
      refresh: () => void;
      requestLogin: () => void;
      buildLoginUrl: (params?: { returnTo?: string }) => string;
    };

const INITIAL_AUTH_CONTEXT: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  error: undefined,
  user: undefined,
  refresh: () => {},
  requestLogin: () => {},
  buildLoginUrl: (params?: { returnTo?: string }) => {
    return '';
  },
};

export const AuthContext = React.createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
  ...options
}: AuthOptions & {
  children: React.ReactNode;
}) {
  const auth = React.useMemo(
    () => new Auth(options),
    // NB: We instantiate a new `Auth` instance only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [state, setState] = React.useState<AuthContextType>(() => {
    return Object.assign({}, INITIAL_AUTH_CONTEXT);
  });

  const load = React.useCallback(
    async ({ shouldForceRefresh }: { shouldForceRefresh?: boolean } = {}) => {
      setState((previousState) => ({
        ...previousState,
        isLoading: true,
        error: undefined,
      }));

      try {
        const isAuthenticated = await auth.isAuthenticated();
        const user = isAuthenticated
          ? shouldForceRefresh
            ? await auth.getUser()
            : await auth.getCachedUser()
          : undefined;

        setState(
          (previousState) =>
            ({
              ...previousState,
              isAuthenticated,
              isLoading: false,
              user,
            } as AuthContextType)
        );
      } catch (causeError) {
        const error =
          causeError instanceof Error
            ? causeError
            : new LoadUserError({ cause: causeError });

        setState((previousState) => ({
          ...previousState,
          isAuthenticated: false,
          isLoading: false,
          user: undefined,
          error,
        }));
      }
    },
    [auth]
  );

  React.useEffect(() => {
    setState((previousState) => ({
      ...previousState,
      refresh: () => load({ shouldForceRefresh: true }),
      requestLogin: () => auth.requestLogin(),
      buildLoginUrl: (params?: AuthRepoBuildLoginUrlParams) =>
        auth.buildLoginUrl(params),
    }));

    load();
  }, [auth, load]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new MissingAuthProviderError();
  }

  return context;
}

export class MicroappReactError extends Error {
  readonly cause?: any;

  constructor(message: string, { cause }: { cause?: any } = {}) {
    super(message);
    this.cause = cause;
  }
}

export class MissingAuthProviderError extends MicroappReactError {
  constructor() {
    super('useAuth must be used within an AuthProvider');
  }
}

export class LoadUserError extends MicroappReactError {
  constructor({ cause }: { cause?: any } = {}) {
    super('Could not load user', { cause });
  }
}

// HEY YOU! DON'T TOUCH THIS VARIABLE!
//
// It is replaced with the proper version at build time via a babel plugin in
// the rollup config.
//
// Export a global property onto the window for Microapp JS detection by the
// Core Web Vitals Technology Report. This way they can configure the `wappalyzer`
// to detect and properly classify live websites as being built with Microapp React:
// https://github.com/HTTPArchive/wappalyzer/blob/main/src/technologies/r.json
const MICROAPP_JS_VERSION = '__MICROAPP_JS_VERSION_PLACEHOLDER__';
try {
  window.__microappJsVersion = MICROAPP_JS_VERSION;
} catch (e) {
  // no-op
}

declare global {
  interface Window {
    __microappJsVersion: string;
  }
}
