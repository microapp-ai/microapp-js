import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  getResizingScriptBuilder,
  getRoutingScriptBuilder,
  MICROAPP_URL_PARAM_NAMES,
} from '@microapp-io/runtime';

const buildResizingScript = getResizingScriptBuilder();
const buildRoutingScript = getRoutingScriptBuilder();

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const response = await fetch(request);
    const contentType = response.headers.get('content-type');
    const isHtmlContentType =
      !!contentType && contentType.includes('text/html');

    if (!isHtmlContentType) {
      return response;
    }

    const requestUrl = new URL(request.url);
    const isUrlTargetedToInjectUrl =
      ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.filter(
        (allowedHostname) =>
          requestUrl.hostname === allowedHostname ||
          requestUrl.hostname.endsWith(`.${allowedHostname}`)
      ).length > 0;

    const targetOriginUrl: URL | null =
      getAllowedTargetOriginUrlByRequest(request);

    const isTargetOriginUrlAllowed =
      !!targetOriginUrl &&
      ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.includes(targetOriginUrl.hostname);

    const headers = new Headers(response.headers);
    headers.delete('X-Frame-Options');
    headers.set(
      'Content-Security-Policy',
      buildContentSecurityPolicyHeader({
        targetOriginUrl,
        isTargetOriginUrlAllowed,
      })
    );

    const shouldInjectScripts =
      isUrlTargetedToInjectUrl && isTargetOriginUrlAllowed;

    if (!shouldInjectScripts) {
      return new Response(response.body, {
        headers,
        status: response.status,
      });
    }

    const targetOrigin = targetOriginUrl.origin;
    const routingScript = buildRoutingScript({ targetOrigin });
    const resizingScript = buildResizingScript({ targetOrigin });

    let html = await response.text();

    html = html.replace(
      '<head>',
      `<head><script data-target-origin="${targetOrigin}">${routingScript}</script>`
    );

    html = html.replace(
      '<body>',
      `<body><script data-target-origin="${targetOrigin}">${resizingScript}</script>`
    );

    return new Response(html, {
      headers,
      status: response.status,
    });
  },
} satisfies ExportedHandler<Env>;

function buildContentSecurityPolicyHeader({
  targetOriginUrl,
  isTargetOriginUrlAllowed,
}: {
  targetOriginUrl: URL | null;
  isTargetOriginUrlAllowed: boolean;
}) {
  const allowedOrigins = [];

  if (targetOriginUrl && isTargetOriginUrlAllowed) {
    allowedOrigins.push(targetOriginUrl.origin);
  }

  if (allowedOrigins.length === 0) {
    return `frame-ancestors 'self'`;
  }

  return `frame-ancestors 'self' ${allowedOrigins.join(' ')}`;
}

function getAllowedTargetOriginUrlByRequest(request: Request): URL | null {
  const requestUrl = new URL(request.url);
  const targetOrigin = requestUrl.searchParams.get(
    MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN
  );

  if (!targetOrigin) {
    return null;
  }

  let targetOriginUrl: URL | null = null;

  try {
    targetOriginUrl = new URL(decodeURIComponent(targetOrigin));
  } catch (e) {
    console.error(
      '[runtime-injector] Invalid target origin URL:',
      targetOrigin
    );
  }

  return targetOriginUrl;
}
