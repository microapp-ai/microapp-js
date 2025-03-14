import { MICROAPP_URL_PARAM_NAMES } from '@microapp-io/runtime';

export function getAllowedTargetOriginUrlByRequest(
  request: Request
): URL | null {
  let targetOrigin = getTargetOriginFromRequest(request);

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

function getTargetOriginFromRequest(request: Request): string | null {
  const requestUrl = new URL(request.url);
  let targetOrigin = requestUrl.searchParams.get(
    MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN
  );

  if (targetOrigin) {
    return targetOrigin;
  }

  const cookieHeader = request.headers.get('cookie');

  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    targetOrigin = cookies[MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN];
  }

  return targetOrigin;
}

function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieString.split(';').forEach((pair) => {
    const parts = pair.trim().split('=');
    if (parts.length === 2) {
      const key = decodeURIComponent(parts[0].trim());
      const value = decodeURIComponent(parts[1].trim());
      cookies[key] = value;
    }
  });

  return cookies;
}
