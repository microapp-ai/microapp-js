import * as React from 'react';
import { MicroappRuntime } from './microapp-runtime';

type MicroappProps = {
  url: string;
  theme?: 'light' | 'dark';
  lang?: 'pt' | 'en' | 'es';
} & Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src'>;
export const Microapp = ({
  url,
  title,
  theme,
  lang,
  ...rest
}: MicroappProps) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const runtimeRef = React.useRef<MicroappRuntime | null>(null);

  React.useEffect(() => {
    if (iframeRef.current) {
      runtimeRef.current = new MicroappRuntime({
        iframeElement: iframeRef.current,
        url,
        theme,
        lang,
      });
    }

    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [theme, lang, url]);

  return <iframe ref={iframeRef} title={title} {...rest} />;
};
