export const buildPathnameWithBeginningAndTrailingSlash = (
  url: string
): string => {
  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  if (!url.endsWith('/')) {
    url += '/';
  }

  return url;
};
