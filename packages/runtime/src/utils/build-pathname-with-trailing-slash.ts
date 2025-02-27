export const buildPathnameWithTrailingSlash = (url: string): string => {
  if (!url.endsWith('/')) {
    url += '/';
  }

  return url;
};
