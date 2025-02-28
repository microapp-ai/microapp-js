import type { Env } from './types';

const SUPPORTED_PROTOCOLS = ['http', 'https'] as const;
type SupportedProtocols = (typeof SUPPORTED_PROTOCOLS)[number];

const PROTOCOL_CACHE_EXPIRATION_IN_SECONDS = 3600 as const;
const HTTPS_CHECK_REQUEST_TIMEOUT = 3000 as const;

export function buildProtocolRequestOptimizer({
  env,
  debug = false,
}: {
  env: Env;
  debug?: boolean;
}): {
  buildRequestUrl: (request: Request) => Promise<string>;
  handleResponse: (response: Response) => Promise<void>;
} {
  function debugLog(message: string, data?: any) {
    if (debug) {
      console.info(`[runtime-injector] ${message}`, data);
    }
  }

  async function buildRequestUrlWithOptimalProtocol(
    request: Request
  ): Promise<string> {
    debugLog('Processing request URL', { url: request.url });

    if (!shouldOptimizeRequestProtocol(request)) {
      debugLog('Skipping optimization for protocol', {
        url: request.url,
      });
      return request.url;
    }

    const protocol = await getOptimalProtocolForHostname(request);
    debugLog('Determined optimal protocol for request', {
      url: request.url,
      protocol,
    });

    if (!protocol) {
      debugLog('No optimal protocol found, using original URL', {
        url: request.url,
      });
      return request.url;
    }

    const updatedUrl = updateUrlProtocol({
      url: request.url,
      protocol,
    });
    debugLog('Updated request URL with optimal protocol', {
      originalUrl: request.url,
      updatedUrl,
    });

    return updatedUrl;
  }

  async function handleResponseProtocol(response: Response): Promise<void> {
    if (!shouldOptimizeRequestProtocol(response)) {
      debugLog('Skipping response protocol handling', {
        url: response.url,
      });
      return;
    }

    const isRedirectStatus = response.status >= 300 && response.status < 400;
    debugLog('Handling response protocol', {
      status: response.status,
      isRedirectStatus,
    });

    if (isRedirectStatus) {
      const hostname = getRequestHostname(response);
      debugLog('Response is redirect; clearing protocol cache', { hostname });
      await clearProtocolCacheByHostname(hostname);
    }
  }

  function shouldOptimizeRequestProtocol(request: Request | Response): boolean {
    const requestUrl = new URL(request.url);
    return requestUrl.protocol === 'https:';
  }

  function getRequestHostname(request: Request | Response): string {
    return request.headers.get('Host') || new URL(request.url).hostname;
  }

  async function getOptimalProtocolForHostname(
    request: Request
  ): Promise<SupportedProtocols | null> {
    const hostname = getRequestHostname(request);
    debugLog('Determined hostname for request', { hostname });

    const cachedProtocol = await getCachedProtocolByHostname(hostname);
    if (cachedProtocol) {
      debugLog('Using cached protocol for hostname', {
        hostname,
        protocol: cachedProtocol,
      });
      return cachedProtocol;
    }

    debugLog('No cached protocol; checking HTTPS support', { hostname });

    try {
      const supportsHttps = await doesHostNameSupportHttps(hostname);
      const protocol: SupportedProtocols = supportsHttps ? 'https' : 'http';
      debugLog('Determined protocol based on HTTPS support', {
        hostname,
        supportsHttps,
        protocol,
      });
      await cacheProtocol({ hostname, protocol });
      return protocol;
    } catch (error) {
      console.error(
        '[runtime-injector] Could not determine optimal protocol for hostname',
        { hostname, error: buildErrorMessage(error) }
      );
      return null;
    }
  }

  async function getCachedProtocolByHostname(
    hostname: string
  ): Promise<SupportedProtocols | null> {
    try {
      const cached = await env.PROTOCOL_CACHE.get(hostname);
      debugLog('Retrieved protocol from cache', { hostname, cached });
      return cached === 'https' ? 'https' : cached === 'http' ? 'http' : null;
    } catch (error) {
      console.error(
        '[runtime-injector] Could not get cached protocol for hostname',
        { hostname, error: buildErrorMessage(error) }
      );
      return null;
    }
  }

  function buildErrorMessage(error: any): string {
    return error instanceof Error ? error.message : String(error);
  }

  async function cacheProtocol({
    hostname,
    protocol,
  }: {
    hostname: string;
    protocol: SupportedProtocols;
  }): Promise<void> {
    try {
      debugLog('Caching protocol for hostname', { hostname, protocol });
      await env.PROTOCOL_CACHE.put(hostname, protocol, {
        expirationTtl: PROTOCOL_CACHE_EXPIRATION_IN_SECONDS,
      });
    } catch (error) {
      console.error(
        '[runtime-injector] Could not cache protocol for hostname',
        { hostname, protocol, error: buildErrorMessage(error) }
      );
    }
  }

  async function clearProtocolCacheByHostname(hostname: string): Promise<void> {
    try {
      debugLog('Clearing protocol cache for hostname', { hostname });
      await env.PROTOCOL_CACHE.delete(hostname);
    } catch (error) {
      console.error(
        '[runtime-injector] Could not clear protocol cache for hostname',
        { hostname, error: buildErrorMessage(error) }
      );
    }
  }

  async function doesHostNameSupportHttps(hostname: string): Promise<boolean> {
    debugLog('Checking HTTPS support for hostname', { hostname });
    const response = await fetch(`https://${hostname}/`, {
      method: 'HEAD',
      cf: { timeout: HTTPS_CHECK_REQUEST_TIMEOUT },
    });

    const isHandshakeError = response.status === 525;

    if (isHandshakeError) {
      debugLog('HTTPS not supported for hostname', { hostname });
      return false;
    }

    const isSuccessful = response.status >= 200 && response.status < 300;

    if (isSuccessful) {
      debugLog('HTTPS supported for hostname', { hostname });
      return true;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  }

  function updateUrlProtocol({
    url,
    protocol,
  }: {
    url: string;
    protocol: SupportedProtocols;
  }): string {
    const urlObj = new URL(url);
    const oldProtocol = urlObj.protocol;
    urlObj.protocol = `${protocol}:`;
    debugLog('Updated URL protocol', {
      originalUrl: url,
      oldProtocol,
      newProtocol: protocol,
    });
    return urlObj.toString();
  }

  return {
    buildRequestUrl: buildRequestUrlWithOptimalProtocol,
    handleResponse: handleResponseProtocol,
  };
}
