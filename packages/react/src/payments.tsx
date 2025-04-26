import * as React from 'react';
import type { MicroappAppSubscription } from '@microapp-io/runtime';
import type { PaymentsOptions } from '@microapp-io/payments';
import { Payments } from '@microapp-io/payments';
import { MicroappReactError } from './error';

export type SubscriptionContextType =
  | {
      hasSubscribed: false;
      isLoading: boolean;
      error?: Error;
      subscription?: undefined;
      requireSubscription: () => void;
    }
  | {
      hasSubscribed: true;
      isLoading: boolean;
      error?: Error;
      subscription: MicroappAppSubscription;
      requireSubscription: () => void;
    };

const INITIAL_SUBSCRIPTION_CONTEXT: SubscriptionContextType = {
  hasSubscribed: false,
  isLoading: false,
  error: undefined,
  subscription: undefined,
  requireSubscription: () => {},
};

export const SubscriptionContext = React.createContext<
  SubscriptionContextType | undefined
>(undefined);

export function SubscriptionProvider({
  children,
  ...options
}: PaymentsOptions & {
  children: React.ReactNode;
}) {
  const payments = React.useMemo(
    () => new Payments(options),
    // NB: We instantiate a new `Subscription` instance only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [state, setState] = React.useState<SubscriptionContextType>(() => {
    return Object.assign({}, INITIAL_SUBSCRIPTION_CONTEXT);
  });

  const fetch = React.useCallback(async () => {
    setState(
      (previousState) =>
        ({
          ...previousState,
          isLoading: true,
          error: undefined,
        } as SubscriptionContextType)
    );

    try {
      const subscription = await payments.getSubscription();
      console.log('[SubscriptionProvider] subscription', subscription);

      setState(
        (previousState) =>
          ({
            ...previousState,
            hasSubscribed: !!subscription,
            isLoading: false,
            subscription: subscription ?? undefined,
          } as SubscriptionContextType)
      );
    } catch (causeError) {
      const error =
        causeError instanceof Error
          ? causeError
          : new FetchSubscriptionError({ cause: causeError });

      setState(
        (previousState) =>
          ({
            ...previousState,
            hasSubscribed: false,
            isLoading: false,
            subscription: undefined,
            error,
          } as SubscriptionContextType)
      );
    }
  }, [payments]);

  React.useEffect(() => {
    setState(
      (previousState) =>
        ({
          ...previousState,
          requireSubscription: () => {
            payments.requireSubscription();
          },
        } as SubscriptionContextType)
    );

    fetch();

    const unsubscribe = payments.onUserSubscribed((subscription) => {
      setState(
        (previousState) =>
          ({
            ...previousState,
            hasSubscribed: !!subscription,
            subscription: subscription ?? undefined,
          } as SubscriptionContextType)
      );
    });

    return () => {
      unsubscribe();
    };
  }, [payments, fetch]);

  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  );
}

type UseSubscriptionOptions = {
  onChange?: (subscription?: MicroappAppSubscription) => void;
};

export function useSubscription(
  options?: UseSubscriptionOptions
): SubscriptionContextType {
  const context = React.useContext(SubscriptionContext);

  if (!context) {
    throw new MissingSubscriptionProviderError();
  }

  React.useEffect(() => {
    if (options?.onChange) {
      options.onChange(context.subscription);
    }
  }, [context.subscription, options]);

  return context;
}

export class MissingSubscriptionProviderError extends MicroappReactError {
  constructor() {
    super('useSubscription must be used within an SubscriptionProvider');
  }
}

export class FetchSubscriptionError extends MicroappReactError {
  constructor({ cause }: { cause?: any } = {}) {
    super('Could not fetch subscription', { cause });
  }
}
