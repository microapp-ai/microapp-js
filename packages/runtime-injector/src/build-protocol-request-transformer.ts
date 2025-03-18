import type { Env, RequestTransformer } from './types';
import { buildLogger } from './utils';

const SUPPORTED_PROTOCOLS = ['http', 'https'] as const;
type SupportedProtocols = (typeof SUPPORTED_PROTOCOLS)[number];

const ONE_HOUR_IN_SECONDS = 60 * 60;
const PROTOCOL_CACHE_EXPIRATION_IN_SECONDS = ONE_HOUR_IN_SECONDS;
const HTTPS_CHECK_REQUEST_TIMEOUT_IN_MS = 3000 as const;

export function buildProtocolRequestTransformer({
  env,
  debug,
}: {
  env: Env;
  debug?: boolean;
}): RequestTransformer & {
  handleResponse: (response: Response) => Promise<void>;
} {
  const logger = buildLogger({
    identifier: 'protocol-optimizer',
    debug,
  });

  async function buildRequestWithOptimalProtocol(
    request: Request
  ): Promise<Request> {
    logger.debug('Processing request URL', { url: request.url });

    if (!shouldOptimizeRequestProtocol(request)) {
      logger.debug('Skipping optimization for protocol', {
        url: request.url,
      });
      return request;
    }

    const protocol = await getOptimalProtocolForHostname(request);
    logger.debug('Determined optimal protocol for request', {
      url: request.url,
      protocol,
    });

    if (!protocol) {
      logger.debug('No optimal protocol found, using original URL', {
        url: request.url,
      });
      return request;
    }

    const updatedUrl = updateUrlProtocol({
      url: request.url,
      protocol,
    });
    logger.debug('Updated request URL with optimal protocol', {
      originalUrl: request.url,
      updatedUrl,
    });

    const updatedRequest = new Request(updatedUrl, request);
    return updatedRequest;
  }

  async function handleResponseProtocol(response: Response): Promise<void> {
    if (!shouldOptimizeRequestProtocol(response)) {
      logger.debug('Skipping response protocol handling', {
        url: response.url,
      });
      return;
    }

    const isRedirectStatus = response.status >= 300 && response.status < 400;
    logger.debug('Handling response protocol', {
      status: response.status,
      isRedirectStatus,
    });

    if (isRedirectStatus) {
      const hostname = getRequestHostname(response);
      logger.debug('Response is redirect; clearing protocol cache', {
        hostname,
      });
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
    logger.debug('Determined hostname for request', { hostname });

    const cachedProtocol = await getCachedProtocolByHostname(hostname);
    if (cachedProtocol) {
      logger.debug('Using cached protocol for hostname', {
        hostname,
        protocol: cachedProtocol,
      });
      return cachedProtocol;
    }

    logger.debug('No cached protocol; checking HTTPS support', { hostname });

    let protocol: SupportedProtocols | null = null;

    try {
      const supportsHttps = await doesHostNameSupportHttps(hostname);
      protocol = supportsHttps ? 'https' : 'http';
      logger.debug('Determined protocol based on HTTPS support', {
        hostname,
        supportsHttps,
        protocol,
      });
    } catch (error) {
      console.error(
        '[runtime-injector] Could not determine optimal protocol for hostname',
        { hostname, error: buildErrorMessage(error) }
      );
    }

    if (protocol) {
      await cacheProtocol({ hostname, protocol });
    }

    return protocol;
  }

  async function getCachedProtocolByHostname(
    hostname: string
  ): Promise<SupportedProtocols | null> {
    try {
      const cached = await env.CACHE.get(buildCacheKeyByHostname(hostname));
      logger.debug('Retrieved protocol from cache', { hostname, cached });
      return cached === 'https' ? 'https' : cached === 'http' ? 'http' : null;
    } catch (error) {
      console.error(
        '[runtime-injector] Could not get cached protocol for hostname',
        { hostname, error: buildErrorMessage(error) }
      );
      return null;
    }
  }

  function buildCacheKeyByHostname(hostname: string): string {
    return `hostnames/${hostname}/protocol`;
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
      logger.debug('Caching protocol for hostname', { hostname, protocol });
      await env.CACHE.put(buildCacheKeyByHostname(hostname), protocol, {
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
      logger.debug('Clearing protocol cache for hostname', { hostname });
      await env.CACHE.delete(buildCacheKeyByHostname(hostname));
    } catch (error) {
      console.error(
        '[runtime-injector] Could not clear protocol cache for hostname',
        { hostname, error: buildErrorMessage(error) }
      );
    }
  }

  async function doesHostNameSupportHttps(hostname: string): Promise<boolean> {
    logger.debug('Checking HTTPS support for hostname', { hostname });
    const response = await fetch(`https://${hostname}/`, {
      method: 'HEAD',
      cf: { timeout: HTTPS_CHECK_REQUEST_TIMEOUT_IN_MS },
    });

    const isHandshakeError = response.status === 525;

    if (isHandshakeError) {
      logger.debug('HTTPS not supported for hostname', { hostname });
      return false;
    }

    const isSuccessful = response.status >= 200 && response.status < 300;

    if (isSuccessful) {
      logger.debug('HTTPS supported for hostname', { hostname });
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
    logger.debug('Updated URL protocol', {
      originalUrl: url,
      oldProtocol,
      newProtocol: protocol,
    });
    return urlObj.toString();
  }

  return {
    transform: buildRequestWithOptimalProtocol,
    handleResponse: handleResponseProtocol,
  };
}
