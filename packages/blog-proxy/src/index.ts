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

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);
    const originalHost = requestUrl.hostname;

    const proxyRequest = createProxyRequest({
      originalRequest: request,
      requestUrl,
      originalHost,
      env,
    });

    console.log('Forwarding request to:', proxyRequest.url);
    const response = await fetch(proxyRequest);

    return handlePossibleRedirect({
      response,
      originalHost,
      targetOriginHostname: env.BLOG_ORIGIN_HOSTNAME,
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
    console.log(
      'No Location header found in response. Returning original response.'
    );
    return response;
  }

  if (!locationHeader.startsWith('http')) {
    console.log('Location header is not a full URL:', locationHeader);
    return response;
  }

  const locationUrl = new URL(locationHeader);

  if (locationUrl.hostname === targetOriginHostname) {
    locationUrl.hostname = originalHost;
    const newLocation = locationUrl.toString();

    console.log('Redirecting to:', newLocation);
    return Response.redirect(newLocation, response.status);
  }

  console.log('Returning original response');
  return response;
}

export default worker;
