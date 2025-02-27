export const removeTrailingSlashFromUrl = (url: string): string => {
  return url.replace(/\/$/, '');
};
