import { buildPathnameWithTrailingSlash } from './build-pathname-with-trailing-slash';

export const buildUrlWithTrailingSlash = (url: URL | string): URL => {
  url = new URL(url.toString());
  url.pathname = buildPathnameWithTrailingSlash(url.pathname);

  return url;
};
