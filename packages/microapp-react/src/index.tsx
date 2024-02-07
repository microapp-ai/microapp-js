import * as React from "react";
import type { AuthConfigParams, User } from "@microapp-io/auth";
import { Auth } from "@microapp-io/auth";

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
    return "";
  },
};

export const AuthContext = React.createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  config,
  children,
}: {
  config?: AuthConfigParams;
  children: React.ReactNode;
}) {
  const auth = React.useMemo(() => new Auth({ config }), [config]);
  const [state, setState] = React.useState<AuthContextType>(() => {
    return Object.assign({}, INITIAL_AUTH_CONTEXT);
  });

  const load = React.useCallback(
    ({ shouldForceRefresh }: { shouldForceRefresh?: boolean } = {}) => {
      setState((previousState) => ({
        ...previousState,
        isLoading: true,
        error: undefined,
      }));

      auth
        .isAuthenticated()
        .then(() => {
          if (shouldForceRefresh) {
            return auth.getUser();
          }
          return auth.getCachedUser();
        })
        .then((user) => {
          setState((previousState) => ({
            ...previousState,
            isAuthenticated: true,
            isLoading: false,
            user,
          }));
        })
        .catch((error) => {
          setState((previousState) => ({
            ...previousState,
            isAuthenticated: false,
            isLoading: false,
            user: undefined,
            error,
          }));
        });
    },
    [auth]
  );

  React.useEffect(() => {
    setState((previousState) => ({
      ...previousState,
      refresh: () => load({ shouldForceRefresh: true }),
      requestLogin: () => auth.requestLogin(),
      buildLoginUrl: (params?: { returnTo?: string }) =>
        auth.buildLoginUrl(params),
    }));

    load();
  }, [auth, load]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
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
const MICROAPP_JS_VERSION = "__MICROAPP_JS_VERSION_PLACEHOLDER__";
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
