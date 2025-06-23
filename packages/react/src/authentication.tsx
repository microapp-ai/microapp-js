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
      userJwtToken?: undefined;
      requestLogin: () => void;
    }
  | {
      isAuthenticated: true;
      isLoading: boolean;
      error?: Error;
      user: User;
      userJwtToken: string;
      requestLogin: () => void;
    };

const INITIAL_AUTH_CONTEXT: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  error: undefined,
  user: undefined,
  userJwtToken: undefined,
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
      let [user, userJwtToken] = await Promise.all<any>([
        auth.getUser(),
        auth.getUserJwtToken(),
      ]);

      // NB: This is a workaround for TypeScript's type inference
      // See: https://github.com/microsoft/TypeScript/issues/34925
      user = user as ReturnType<typeof auth.getUser>;
      userJwtToken = userJwtToken as ReturnType<typeof auth.getUserJwtToken>;

      console.log('[AuthProvider] user', user);
      console.log(
        '[AuthProvider] userJwtToken',
        userJwtToken ? userJwtToken.slice(0, 10) : null
      );

      setState(
        (previousState) =>
          ({
            ...previousState,
            isAuthenticated: !!user,
            isLoading: false,
            user: user ?? undefined,
            userJwtToken: userJwtToken ?? undefined,
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
        userJwtToken: undefined,
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
      console.log('[AuthProvider] Changed user', user ? user.id : 'no user');

      setState(
        (previousState) =>
          ({
            ...previousState,
            isAuthenticated: !!user,
            user: user ?? undefined,
          } as AuthContextType)
      );

      auth.getUserJwtToken().then((userJwtToken) => {
        console.log(
          '[AuthProvider] Changed userJwtToken',
          userJwtToken ? userJwtToken.slice(0, 10) : 'no token'
        );

        setState(
          (previousState) =>
            ({
              ...previousState,
              userJwtToken: userJwtToken ?? undefined,
            } as AuthContextType)
        );
      });
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
