import type { MicroappLanguage, MicroappTheme } from './types';
import { MICROAPP_URL_PARAM_NAMES } from './constants';
import { buildUrlWithTrailingSlash } from './utils';

export const buildMicroappUrl = (
  microappUrl: URL | string,
  {
    baseUrl,
    currentUrl,
    targetOrigin,
    theme,
    lang,
  }: {
    baseUrl?: URL | string;
    currentUrl?: URL | string;
    targetOrigin: URL | string;
    theme?: MicroappTheme;
    lang?: MicroappLanguage;
  }
): string => {
  const iframeUrl = buildUrlWithTrailingSlash(microappUrl);

  if (!currentUrl && typeof window !== 'undefined') {
    currentUrl = buildUrlWithTrailingSlash(window.location.href);
  }

  const searchParams = currentUrl
    ? new URLSearchParams(buildUrlWithTrailingSlash(currentUrl).search)
    : new URLSearchParams(iframeUrl.search);

  searchParams.set(
    MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN,
    targetOrigin.toString()
  );

  if (theme) searchParams.set(MICROAPP_URL_PARAM_NAMES.THEME, theme);
  if (lang) searchParams.set(MICROAPP_URL_PARAM_NAMES.LANGUAGE, lang);

  const queryString = searchParams.toString();
  iframeUrl.search = queryString;

  if (baseUrl && currentUrl) {
    baseUrl = buildUrlWithTrailingSlash(baseUrl);
    currentUrl = buildUrlWithTrailingSlash(currentUrl);
    const currentPath = currentUrl.pathname.replace(baseUrl.pathname, '/');
    iframeUrl.pathname = currentPath;
  }

  return iframeUrl.toString();
};
