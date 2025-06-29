import * as React from 'react';
import { useCallback } from 'react';
import type { MicroappRuntimeOptions } from './microapp-runtime';
import { MicroappRuntime } from './microapp-runtime';
import { buildMicroappUrl } from './build-microapp-url';
import { MicroappRouteState } from './microapp-route-state';
import { buildMicroappIframeId } from './utils';

type MicroappProps = {
  id: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loadingComponent?: React.ReactNode;
  canLoad?: boolean;
} & Pick<
  MicroappRuntimeOptions,
  | 'homeUrl'
  | 'baseUrl'
  | 'currentUrl'
  | 'targetOrigin'
  | 'theme'
  | 'lang'
  | 'user'
  | 'onRequireUser'
  | 'appSubscription'
  | 'onRequireAppSubscription'
  | 'onRequestUserJwtToken'
> &
  Omit<
    React.IframeHTMLAttributes<HTMLIFrameElement>,
    'src' | 'onError' | 'onLoad'
  >;

const MicroappContext = React.createContext<{
  __MICROAPP_CONTEXT__: true;
} | null>(null);

export function MicroappProvider({ children }: { children?: any }) {
  React.useEffect(() => {
    const handlePopState = (event: Event) => {
      const routeState = MicroappRouteState.fromEvent(event);

      if (routeState) {
        routeState.reloadOnPopStateEventIfIframeIsNotVisible(event);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <MicroappContext.Provider value={{ __MICROAPP_CONTEXT__: true }}>
      {children}
    </MicroappContext.Provider>
  );
}

export function Microapp({ canLoad, theme, ...rest }: MicroappProps) {
  if (!canLoad) return <DefaultLoadingSpinner theme={theme} />;
  return <MicroappIframe {...rest} theme={theme} />;
}

function MicroappIframe({
  id,
  homeUrl,
  baseUrl,
  currentUrl,
  targetOrigin,
  theme,
  lang,
  user,
  onRequireUser,
  appSubscription,
  onRequireAppSubscription,
  onRequestUserJwtToken,
  onLoad,
  onError,
  loadingComponent,
  title,
  canLoad,
  ...rest
}: MicroappProps) {
  if ('id' in rest) {
    console.warn(
      '[@microapp-io/runtime] The "id" prop is not supported. Use "title" instead.'
    );
  }

  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const runtimeRef = React.useRef<MicroappRuntime | null>(null);
  const runtimeOptions = React.useMemo(
    () => ({
      id,
      homeUrl,
      baseUrl,
      currentUrl,
      targetOrigin,
      theme,
      lang,
      user,
      onRequireUser,
      appSubscription,
      onRequireAppSubscription,
      onRequestUserJwtToken,
    }),
    [
      id,
      homeUrl,
      baseUrl,
      currentUrl,
      targetOrigin,
      theme,
      lang,
      user,
      onRequireUser,
      appSubscription,
      onRequireAppSubscription,
      onRequestUserJwtToken,
    ]
  );

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(
    () => {
      const iframe = iframeRef.current;

      if (!iframe) {
        return;
      }

      const runtime = runtimeRef.current;

      if (!runtime) {
        try {
          runtimeRef.current = new MicroappRuntime({
            iframe,
            ...runtimeOptions,
          });
        } catch (error) {
          setIsLoading(false);
          onError?.(
            new MicroappInitializationError(
              '[@microapp-io/runtime] Failed to initialize',
              error
            )
          );
        }
      }

      return () => {
        runtimeRef.current?.tearDown();
        runtimeRef.current = null;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getChangedValues = useGetChangedValues(runtimeOptions);

  React.useEffect(() => {
    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    const changedValues = getChangedValues();

    if (Object.keys(changedValues).length > 0) {
      runtime.update(changedValues);
    }
  }, [getChangedValues]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const iframeSrc = useMicroappUrl(runtimeOptions);
  const iframeId = React.useMemo(
    () => buildMicroappIframeId({ homeUrl }),
    [homeUrl]
  );

  const isMicroappContext = React.useContext(MicroappContext);

  if (!isMicroappContext) {
    console.error(
      '[@microapp-io/runtime] The "Microapp" component must be a child of "MicroappProvider".'
    );
    return null;
  }

  return (
    <>
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          seamless
          width="100%"
          height="0"
          frameBorder="0"
          scrolling="no"
          {...rest}
          data-microapp-id={iframeId}
          title={title}
          onLoad={handleLoad}
          ref={iframeRef}
        />
      )}
      {isLoading &&
        (loadingComponent ? (
          loadingComponent
        ) : (
          <DefaultLoadingSpinner theme={theme} />
        ))}
    </>
  );
}

type DefaultLoadingSpinnerProps = React.HTMLAttributes<HTMLDivElement> &
  Pick<MicroappRuntimeOptions, 'theme'>;

const DefaultLoadingSpinner = ({
  theme,
  ...props
}: DefaultLoadingSpinnerProps) => (
  <div
    {...props}
    style={{
      ...props.style,
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        theme === 'dark' ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)',
      zIndex: 999999,
      width: '100%',
      height: '100%',
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid',
        borderTopColor: theme === 'dark' ? '#000' : '#fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

export class MicroappInitializationError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'MicroappInitializationError';
    this.cause = cause;

    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${
        cause instanceof Error ? cause.stack : cause
      }`;
    }
  }
}

function useGetChangedValues<T extends Record<string, any>>(
  values: T
): () => Partial<T> {
  const prevValuesRef = React.useRef<T>(values);
  const getChangedValues = (): Partial<T> => {
    const changedValues: Partial<T> = {} as Partial<T>;

    Object.keys(values).forEach((key) => {
      if (values[key] !== prevValuesRef.current[key]) {
        changedValues[key as keyof T] = values[key];
        prevValuesRef.current = {
          ...prevValuesRef.current,
          [key]: values[key],
        };
      }
    });

    return changedValues;
  };

  return getChangedValues;
}

export function useMicroappUrl({
  homeUrl,
  baseUrl,
  currentUrl,
  targetOrigin,
  theme,
  lang,
}: Omit<MicroappRuntimeOptions, 'iframe'>): string | undefined {
  // NB: We don't want to trigger a re-render when the theme or lang changes
  const initialThemeRef = React.useRef(theme);
  const initialLangRef = React.useRef(lang);

  return React.useMemo(
    () =>
      targetOrigin
        ? buildMicroappUrl(homeUrl, {
            baseUrl,
            currentUrl,
            targetOrigin,
            theme: initialThemeRef.current,
            lang: initialLangRef.current,
          })
        : undefined,
    [homeUrl, baseUrl, currentUrl, targetOrigin]
  );
}
