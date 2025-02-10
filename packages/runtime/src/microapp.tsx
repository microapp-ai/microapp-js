import * as React from 'react';
import { MicroappRuntime } from './microapp-runtime';

type MicroappProps = {
  url: string;
  theme?: string;
  lang?: string;
  height?: number | string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onRouteChange?: (route: string) => void;
} & Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src'>;

export const Microapp: React.FC<MicroappProps> = ({
  url,
  title,
  theme = 'light',
  lang = 'en',
  onLoad,
  onError,
  onRouteChange,
  ...rest
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const runtimeRef = React.useRef<MicroappRuntime | null>(null);

  React.useEffect(() => {
    if (iframeRef.current) {
      try {
        if (runtimeRef.current) {
          runtimeRef.current.destroy();
        }

        runtimeRef.current = new MicroappRuntime({
          iframeElement: iframeRef.current,
          url,
          theme,
          lang,
          onRouteChange,
        });

        onLoad?.();
        runtimeRef.current.setIframeDimensions();
        runtimeRef.current.setIframeTheme(theme);
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error
            : new Error('Failed to initialize microapp')
        );
      }
    }

    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [url, onLoad, onError, onRouteChange]);

  React.useEffect(() => {
    if (runtimeRef.current) {
      runtimeRef.current.setIframeTheme(theme);
    }
  }, [theme]);

  React.useEffect(() => {
    if (runtimeRef.current) {
      runtimeRef.current.setIframeLang(lang);
    }
  }, [lang]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
      }}
      {...rest}
    />
  );
};
