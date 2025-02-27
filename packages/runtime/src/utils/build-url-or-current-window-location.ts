import { buildUrlWithTrailingSlash } from './build-url-with-trailing-slash';

export const buildUrlOrCurrentWindowLocation = (
  url?: URL | string
): URL | undefined => {
  if (url) {
    return buildUrlWithTrailingSlash(url);
  }

  if (typeof window !== 'undefined') {
    return buildUrlWithTrailingSlash(window.location.href);
  }

  return undefined;
};
