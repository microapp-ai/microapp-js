export function buildOriginUrl(url: string | URL): string {
  const parsedUrl = new URL(url.toString());
  return parsedUrl.origin;
}
