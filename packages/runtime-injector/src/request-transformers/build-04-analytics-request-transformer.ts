import type {
  RequestTransformer,
  RequestTransformerBuilderInput,
  RequestTransformerInput,
} from '../build-request-transformer';
import { buildLogger } from '../utils';
import type { MicroappApp } from '../types';

const ANALYTICS_CACHE_EXPIRATION_IN_SECONDS = 60 * 60 * 24;

export function build04AnalyticsRequestTransformer({
  env,
  debug,
}: RequestTransformerBuilderInput): RequestTransformer {
  const logger = buildLogger({
    identifier: 'analytics',
  });

  async function transform({
    request,
    rewriter,
  }: RequestTransformerInput): Promise<void> {
    const websiteId = await getWebsiteIdByRequest(request);

    if (!websiteId) {
      return;
    }

    const analyticsScript = getAnalyticsScript(websiteId);

    rewriter.on('head', {
      element(element) {
        element.append(analyticsScript, { html: true });
      },
    });
  }

  async function getWebsiteIdByRequest(
    request: Request
  ): Promise<string | null> {
    const appSlug = getAppSlugByRequest(request);

    if (!appSlug) {
      return null;
    }

    const cacheKey = buildCacheKeyByAppSlug(appSlug);
    const cache = await env.CACHE.get(cacheKey);

    if (cache) {
      const cachedData = JSON.parse(cache);
      const cachedWebsiteId = cachedData.websiteId;
      logger.debug('Website ID from cache', cachedWebsiteId);
      return cachedWebsiteId;
    }

    const websiteId = await getWebsiteIdByAppSlug(appSlug);
    logger.debug('Website ID from API', websiteId);

    await env.CACHE.put(cacheKey, JSON.stringify({ websiteId }), {
      expirationTtl: ANALYTICS_CACHE_EXPIRATION_IN_SECONDS,
    });

    logger.debug('Website ID cached', websiteId);

    return websiteId;
  }

  function buildCacheKeyByAppSlug(appSlug: string) {
    return `websiteId:${appSlug}`;
  }

  async function getWebsiteIdByAppSlug(
    appSlug: string
  ): Promise<string | null> {
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
    return appData.analyticsWebsiteId;
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

  function getAnalyticsScript(websiteId: string) {
    return `<script async defer data-website-id="${websiteId}" src="${env.ANALYTICS_SCRIPT_URL}"></script>`;
  }

  return {
    transform,
  };
}
