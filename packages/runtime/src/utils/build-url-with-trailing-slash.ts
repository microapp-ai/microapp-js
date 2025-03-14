import { buildPathnameWithBeginningAndTrailingSlash } from './build-pathname-with-beginning-and-trailing-slash';

export const buildUrlWithTrailingSlash = (url: URL | string): URL => {
  url = new URL(url.toString());
  url.pathname = buildPathnameWithBeginningAndTrailingSlash(url.pathname);

  return url;
};
