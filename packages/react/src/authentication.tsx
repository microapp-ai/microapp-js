import * as React from 'react';
import type { AuthOptions, User } from '@microapp-io/auth';
import { Auth } from '@microapp-io/auth';
import { MicroappReactError } from './error';

export type AuthContextType =
  | {
      isAuthenticated: false;
      isLoading: boolean;
      error?: Error;
      user?: undefined;
      requestLogin: () => void;
    }
  | {
      isAuthenticated: true;
      isLoading: boolean;
      error?: Error;
      user: User;
      requestLogin: () => void;
    };

const INITIAL_AUTH_CONTEXT: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  error: undefined,
  user: undefined,
  requestLogin: () => {},
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

  const fetch = React.useCallback(async () => {
    setState(
      (previousState) =>
        ({
          ...previousState,
          isLoading: true,
          error: undefined,
        } as AuthContextType)
    );

    try {
      const user = await auth.getUser();
      console.log('[AuthProvider] user', user);

      setState(
        (previousState) =>
          ({
            ...previousState,
            isAuthenticated: !!user,
            isLoading: false,
            user: user ?? undefined,
          } as AuthContextType)
      );
    } catch (causeError) {
      const error =
        causeError instanceof Error
          ? causeError
          : new FetchUserError({ cause: causeError });

      setState((previousState) => ({
        ...previousState,
        isAuthenticated: false,
        isLoading: false,
        user: undefined,
        error,
      }));
    }
  }, [auth]);

  React.useEffect(() => {
    setState(
      (previousState) =>
        ({
          ...previousState,
          requestLogin: () => auth.requestLogin(),
        } as AuthContextType)
    );

    fetch();

    const unsubscribe = auth.onUserAuthenticated((user) => {
      setState(
        (previousState) =>
          ({
            ...previousState,
            isAuthenticated: !!user,
            user: user ?? undefined,
          } as AuthContextType)
      );
    });

    return () => {
      unsubscribe();
    };
  }, [auth, fetch]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

type UseAuthOptions = {
  onChange?: (user?: User) => void;
};

export function useAuth(options?: UseAuthOptions): AuthContextType {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new MissingAuthProviderError();
  }

  React.useEffect(() => {
    if (options?.onChange) {
      options.onChange(context.user);
    }
  }, [context.user, options]);

  return context;
}

export class MissingAuthProviderError extends MicroappReactError {
  constructor() {
    super('useAuth must be used within an AuthProvider');
  }
}

export class FetchUserError extends MicroappReactError {
  constructor({ cause }: { cause?: any } = {}) {
    super('Could not fetch user', { cause });
  }
}
