import { buildLogger } from './utils';
import type { Env, MicroappMarketplaceApp, RequestTransformer } from './types';

const FIVE_MINUTES_IN_SECONDS = 60 * 5;
const APP_CACHE_EXPIRATION_IN_SECONDS = FIVE_MINUTES_IN_SECONDS;

export function buildAppRequestTransformer({
  env,
  debug,
}: {
  env: Env;
  debug: boolean;
}): RequestTransformer & {
  getAppByRequest: (request: Request) => Promise<MicroappMarketplaceApp | null>;
} {
  const logger = buildLogger({
    identifier: 'app-request-transformer',
    debug,
  });

  async function getAppByRequest(
    request: Request
  ): Promise<MicroappMarketplaceApp | null> {
    const appSlug = getAppSlugByRequest(request);

    if (!appSlug) {
      return null;
    }

    const cacheKey = buildCacheKeyByAppSlug(appSlug);
    const cache = await env.CACHE.get(cacheKey);

    if (cache) {
      const cachedData = JSON.parse(cache) as MicroappMarketplaceApp;
      logger.debug('App data from cache', cachedData);
      return cachedData;
    }

    const app = await fetchAppBySlug(appSlug);
    logger.debug('App data from API', app);

    await env.CACHE.put(cacheKey, JSON.stringify(app), {
      expirationTtl: APP_CACHE_EXPIRATION_IN_SECONDS,
    });

    logger.debug('App data cached', app);

    return app;
  }

  function getAppSlugByRequest(request: Request) {
    const requestUrl = new URL(request.url);
    const hostnameParts = requestUrl.hostname.split('.');

    if (hostnameParts.length < 2) {
      logger.error('Invalid hostname', requestUrl.hostname);
      return null;
    }

    logger.debug('App slug', hostnameParts[0]);
    return hostnameParts[0];
  }

  function buildCacheKeyByAppSlug(appSlug: string) {
    return `marketplace-apps/${appSlug}`;
  }

  async function fetchAppBySlug(
    appSlug: string
  ): Promise<MicroappMarketplaceApp | null> {
    const response = await fetch(
      `${env.MICROAPP_API_URL}/marketplace/apps/${appSlug}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.MICROAPP_API_KEY}`,
        },
      }
    );

    if (response.status !== 200) {
      const body = await response.text();
      logger.error('Failed to fetch app data', {
        status: response.status,
        body,
      });
      return null;
    }

    const appData = (await response.json()) as MicroappMarketplaceApp;
    return appData;
  }

  async function buildRequestWithAppHostname(
    request: Request
  ): Promise<Request> {
    const app = await getAppByRequest(request);
    const requestUrl = new URL(request.url);

    if (!app) {
      logger.error('App not found', requestUrl.hostname);
      return request;
    }

    if (!app.isPublishedOnMarketplace) {
      logger.error('App not published', app);
      return request;
    }

    if (!app.privateUrl) {
      throw new Error('App private URL is not set');
    }

    const hostUrl = new URL(app.privateUrl);
    requestUrl.protocol = hostUrl.protocol;
    requestUrl.hostname = hostUrl.hostname;
    logger.debug('App host URL', requestUrl.toString());

    const updatedRequest = new Request(requestUrl, request);
    return updatedRequest;
  }

  return {
    getAppByRequest,
    transform: buildRequestWithAppHostname,
  };
}
