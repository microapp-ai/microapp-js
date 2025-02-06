import * as React from 'react';
import { MicroappRuntime } from './microapp-runtime';

type MicroappProps = {
  url: string;
  theme?: 'light' | 'dark';
  lang?: 'pt' | 'en' | 'es';
  height?: number | string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
} & Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src'>;

export const Microapp: React.FC<MicroappProps> = ({
  url,
  title,
  theme = 'light',
  lang = 'en',
  onLoad,
  onError,
  ...rest
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const runtimeRef = React.useRef<MicroappRuntime | null>(null);

  React.useEffect(() => {
    if (iframeRef.current) {
      try {
        runtimeRef.current = new MicroappRuntime({
          iframeElement: iframeRef.current,
          url,
          // theme,
          // lang,
        });
        onLoad?.();
        setTimeout(() => {
          runtimeRef.current?.setIframeDimensions();
        }, 1000);
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
  }, [theme, lang, url, onLoad, onError]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      style={{
        border: 'none',
        minHeight: '100%',
      }}
      width={'100%'}
      {...rest}
    />
  );
};
