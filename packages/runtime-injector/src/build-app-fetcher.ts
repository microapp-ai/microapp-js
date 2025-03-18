import { buildLogger } from './utils';
import type { Env, MicroappApp } from './types';

const FIVE_MINUTES_IN_SECONDS = 60 * 5;
const APP_CACHE_EXPIRATION_IN_SECONDS = FIVE_MINUTES_IN_SECONDS;

export function buildAppFetcher({
  env,
  debug,
}: {
  env: Env;
  debug?: boolean;
}): {
  getAppByRequest: (request: Request) => Promise<MicroappApp | null>;
} {
  const logger = buildLogger({
    identifier: 'get-app-info',
    debug,
  });

  async function getAppByRequest(
    request: Request
  ): Promise<MicroappApp | null> {
    const appSlug = getAppSlugByRequest(request);

    if (!appSlug) {
      return null;
    }

    const cacheKey = buildCacheKeyByAppSlug(appSlug);
    const cache = await env.CACHE.get(cacheKey);

    if (cache) {
      const cachedData = JSON.parse(cache) as MicroappApp;
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
    return `apps/${appSlug}`;
  }

  async function fetchAppBySlug(appSlug: string): Promise<MicroappApp | null> {
    const response = await fetch(`${env.MICROAPP_API_URL}/apps/${appSlug}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MICROAPP_API_KEY}`,
      },
    });

    if (!response.ok) {
      logger.error('Failed to fetch app data', response);
      return null;
    }

    const appData = (await response.json()) as MicroappApp;
    return appData;
  }

  return {
    getAppByRequest,
  };
}
