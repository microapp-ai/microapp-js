import { buildMicroappIframeId } from './build-microapp-iframe-id';

export function getMicroappIframeElement({
  homeUrl,
}: {
  homeUrl: string;
}): HTMLIFrameElement | null {
  const iframeId = buildMicroappIframeId({ homeUrl });
  return document.querySelector<HTMLIFrameElement>(
    `[data-microapp-id="${iframeId}"]`
  );
}
