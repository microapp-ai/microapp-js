import * as React from 'react';
import { MicroappRuntime } from './microapp-runtime';
import { useEffect } from 'react';

type MicroappProps = {
  url: string;
  theme?: string;
  lang?: string;
  height?: number | string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loadingComponent?: JSX.Element;
} & Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src'>;

export const Microapp: React.FC<MicroappProps> = ({
  url,
  title,
  theme,
  lang,
  onLoad,
  onError,
  loadingComponent,
  ...rest
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const runtimeRef = React.useRef<MicroappRuntime | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (iframeRef.current) {
      try {
        const runtime = runtimeRef.current;
        if (!runtime) {
          runtimeRef.current = new MicroappRuntime({
            iframeElement: iframeRef.current,
            url,
            theme,
            lang,
          });
          setIsLoading(false);
        } else {
          runtimeRef.current?.update({
            url,
            theme,
            lang,
          });
        }

        onLoad?.();
      } catch (error) {
        setIsLoading(false);
        onError?.(
          error instanceof Error
            ? error
            : new Error('Failed to initialize microapp')
        );
      }
    }
  }, [url, theme, lang, onLoad, onError]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title={title}
        style={{
          border: 'none',
        }}
        {...rest}
      />
      {isLoading ? (
        loadingComponent ? (
          loadingComponent
        ) : (
          <DefaultLoadingSpinner />
        )
      ) : null}
    </>
  );
};

const DefaultLoadingSpinner = () => (
  <div
    style={{
      position: 'absolute',
      top: '0',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.8)',
      zIndex: 10000,
      width: '100vw',
      height: '100vh',
      padding: '25%',
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
