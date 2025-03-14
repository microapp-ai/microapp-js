export function buildMicroappIframeId({
  homeUrl,
}: {
  homeUrl: string;
}): string {
  // Create a simple hash from the URL string
  let hash = 0;
  for (let i = 0; i < homeUrl.length; i++) {
    const char = homeUrl.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use absolute value and convert to hex to ensure valid CSS selector
  const hashStr = Math.abs(hash).toString(16);

  return `microapp-iframe-${hashStr}`;
}
