import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { MicroappRuntimeOptions } from './microapp-runtime';
import { MicroappRuntime } from './microapp-runtime';
import { buildMicroappUrl } from './build-microapp-url';
import { MicroappRouteState } from './microapp-route-state';
import { buildMicroappIframeId } from './utils';

type MicroappProps = {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loadingComponent?: React.ReactNode;
} & Pick<
  MicroappRuntimeOptions,
  'homeUrl' | 'baseUrl' | 'currentUrl' | 'targetOrigin' | 'theme' | 'lang'
> &
  Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src'>;

const MicroappContext = React.createContext<{
  __MICROAPP_CONTEXT__: true;
} | null>(null);

export function MicroappProvider({ children }: { children?: any }) {
  useEffect(() => {
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

export function Microapp({
  homeUrl,
  baseUrl,
  currentUrl,
  targetOrigin,
  theme,
  lang,
  onLoad,
  onError,
  loadingComponent,
  title,
  ...rest
}: MicroappProps) {
  if ('id' in rest) {
    console.warn(
      '[Microapp] The "id" prop is not supported. Use "title" instead.'
    );
  }

  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const runtimeRef = React.useRef<MicroappRuntime | null>(null);
  const runtimeOptions = React.useMemo(
    () => ({
      homeUrl,
      baseUrl,
      currentUrl,
      targetOrigin,
      theme,
      lang,
    }),
    [homeUrl, baseUrl, currentUrl, targetOrigin, theme, lang]
  );

  const getChangedValues = useGetChangedValues(runtimeOptions);
  const [isLoading, setIsLoading] = React.useState(true);
  const iframeSrc = useMicroappUrl(runtimeOptions);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    try {
      const changedValues = getChangedValues();
      const runtime = runtimeRef.current;

      if (runtime) {
        runtime.update(changedValues);
        return;
      }

      runtimeRef.current = new MicroappRuntime({
        iframe,
        ...runtimeOptions,
      });
    } catch (error) {
      setIsLoading(false);
      onError?.(
        new MicroappInitializationError(
          '[Microapp] Failed to initialize',
          error
        )
      );
    }
  }, [getChangedValues, runtimeOptions, onError]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const iframeId = useMemo(() => buildMicroappIframeId({ homeUrl }), [homeUrl]);
  const isMicroappContext = React.useContext(MicroappContext);

  if (!isMicroappContext) {
    console.error(
      '[Microapp] The "Microapp" component must be a child of "MicroappProvider".'
    );
    return null;
  }

  return (
    <>
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
        borderTop: '4px solid #3498db',
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
  const prevValuesRef = useRef<T>(values);
  const getChangedValues = (): Partial<T> => {
    const changedValues: Partial<T> = {};

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
  return React.useMemo(
    () =>
      targetOrigin
        ? buildMicroappUrl(homeUrl, {
            baseUrl,
            currentUrl,
            targetOrigin,
            theme,
            lang,
          })
        : undefined,
    [homeUrl, baseUrl, currentUrl, targetOrigin, theme, lang]
  );
}
