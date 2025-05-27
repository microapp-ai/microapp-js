import type { Env } from './types';

interface ProxyRequestOptions {
  originalRequest: Request;
  requestUrl: URL;
  originalHost: string;
  env: Env;
}

interface RedirectOptions {
  response: Response;
  originalHost: string;
  targetOriginHostname: string;
}

interface IsPublicDomainParams {
  originalHost: string;
  requestUrl: URL;
  publicSiteUrl: URL;
}

interface CreatePublicUrlParams {
  requestUrl: URL;
  publicSiteUrl: URL;
}

interface RobotsOptions {
  response: Response;
  originalHost: string;
  requestUrl: URL;
  publicSiteUrl: URL;
}

interface AddPublicUrlToHtmlParams {
  response: Response;
  publicUrl: string;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const publicSiteUrl = new URL(env.BLOG_PUBLIC_URL);
    const requestUrl = new URL(request.url);
    const originalHost = requestUrl.hostname;

    const proxyRequest = createProxyRequest({
      originalRequest: request,
      requestUrl,
      originalHost,
      env,
    });

    console.log('Proxying request to:', proxyRequest.url);
    const response = await fetch(proxyRequest);

    const redirectHandledResponse = handlePossibleRedirect({
      response,
      originalHost,
      targetOriginHostname: env.BLOG_ORIGIN_HOSTNAME,
    });

    return await handleRobotsHeaders({
      response: redirectHandledResponse,
      originalHost,
      requestUrl,
      publicSiteUrl,
    });
  },
};

function createProxyRequest({
  originalRequest,
  requestUrl,
  originalHost,
  env,
}: ProxyRequestOptions): Request {
  const proxyUrl = new URL(requestUrl.toString());
  proxyUrl.hostname = env.BLOG_ORIGIN_HOSTNAME;

  const proxyRequest = new Request(proxyUrl, originalRequest);

  proxyRequest.headers.set('Host', env.BLOG_ORIGIN_HOSTNAME);
  proxyRequest.headers.set('X-Forwarded-Host', originalHost);
  proxyRequest.headers.set(
    'X-Forwarded-Proto',
    requestUrl.protocol.replace(':', '')
  );

  const port =
    requestUrl.port || (requestUrl.protocol === 'https:' ? '443' : '80');
  proxyRequest.headers.set('X-Forwarded-Port', port);

  const clientIP =
    originalRequest.headers.get('CF-Connecting-IP') ||
    originalRequest.headers.get('X-Forwarded-For') ||
    '';
  proxyRequest.headers.set('X-Forwarded-For', clientIP);

  return proxyRequest;
}

function handlePossibleRedirect({
  response,
  originalHost,
  targetOriginHostname,
}: RedirectOptions): Response {
  const locationHeader = response.headers.get('Location');

  if (!locationHeader) {
    return response;
  }

  if (!locationHeader.startsWith('http')) {
    return response;
  }

  const locationUrl = new URL(locationHeader);

  if (locationUrl.hostname === targetOriginHostname) {
    locationUrl.hostname = originalHost;
    const newLocation = locationUrl.toString();

    console.log('Redirecting to:', newLocation);
    return Response.redirect(newLocation, response.status);
  }

  return response;
}

function isPublicDomain({
  originalHost,
  requestUrl,
  publicSiteUrl,
}: IsPublicDomainParams): boolean {
  const currentUrl = new URL(requestUrl);
  currentUrl.hostname = originalHost;

  const hostnamesMatch = currentUrl.hostname === publicSiteUrl.hostname;
  const pathsMatch = currentUrl.pathname.startsWith(publicSiteUrl.pathname);

  return hostnamesMatch && pathsMatch;
}

function createPublicUrl({
  requestUrl,
  publicSiteUrl,
}: CreatePublicUrlParams): URL {
  const publicUrl = new URL(publicSiteUrl);

  const publicPath = publicSiteUrl.pathname;
  const requestPath = requestUrl.pathname;
  const pathStartsWithPublicPath = requestPath.startsWith(publicPath);

  if (pathStartsWithPublicPath) {
    const relativePath = requestPath.slice(publicPath.length);
    publicUrl.pathname = publicPath + relativePath;
  }

  if (!pathStartsWithPublicPath) {
    publicUrl.pathname = requestPath;
  }

  publicUrl.search = requestUrl.search;
  return publicUrl;
}

function addNoindexHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, nosnippet, noarchive'
  );
  return newResponse;
}

function removeNoindexHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.delete('X-Robots-Tag');
  return newResponse;
}

class RemoveCanonicalHtmlTagHandler {
  element(element: Element) {
    element.remove();
  }
}

interface AddCanonicalHtmlTagHandlerParams {
  publicUrl: string;
}

class AddCanonicalHtmlTagHandler {
  publicUrl: string;

  constructor({ publicUrl }: AddCanonicalHtmlTagHandlerParams) {
    this.publicUrl = publicUrl;
  }

  element(element: Element) {
    element.append(`<link rel="canonical" href="${this.publicUrl}" />`, {
      html: true,
    });
  }
}

async function handleRobotsHeaders({
  response,
  originalHost,
  requestUrl,
  publicSiteUrl,
}: RobotsOptions): Promise<Response> {
  const isOnPublicDomain = isPublicDomain({
    originalHost,
    requestUrl,
    publicSiteUrl,
  });

  if (!isOnPublicDomain) {
    const publicUrl = createPublicUrl({ requestUrl, publicSiteUrl });
    const responseWithNoindex = addNoindexHeaders(response);
    console.log(
      'Added noindex headers for non-public domain:',
      publicUrl.toString()
    );

    return addPublicUrlToHtml({
      response: responseWithNoindex,
      publicUrl: publicUrl.toString(),
    });
  }

  return removeNoindexHeaders(response);
}

function addPublicUrlToHtml({
  response,
  publicUrl,
}: AddPublicUrlToHtmlParams): Response {
  return new HTMLRewriter()
    .on('link[rel="canonical"]', new RemoveCanonicalHtmlTagHandler())
    .on('head', new AddCanonicalHtmlTagHandler({ publicUrl }))
    .transform(response);
}

export default worker;
