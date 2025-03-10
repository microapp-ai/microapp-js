import { MICROAPP_URL_PARAM_NAMES } from '@microapp-io/runtime';

export function getAllowedTargetOriginUrlByRequest(
  request: Request
): URL | null {
  const requestUrl = new URL(request.url);
  const targetOrigin = requestUrl.searchParams.get(
    MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN
  );

  if (!targetOrigin) {
    return null;
  }

  try {
    return new URL(decodeURIComponent(targetOrigin));
  } catch (e) {
    console.error('Invalid target origin URL:', targetOrigin);
    return null;
  }
}
