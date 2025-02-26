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
    const url = new URL(request.url);
    let targetOriginUrl: URL | null = null;
    let targetOrigin = url.searchParams.get(
      MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN
    );

    targetOrigin = targetOrigin ? decodeURIComponent(targetOrigin) : null;

    try {
      if (targetOrigin) {
        targetOriginUrl = new URL(targetOrigin);
      }
    } catch (e) {
      console.error('Invalid target origin URL', e);
    }

    const contentType = response.headers.get('content-type');
    const shouldInjectScripts =
      ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.filter(
        (hostname) =>
          url.hostname === hostname || url.hostname.endsWith(`.${hostname}`)
      ).length > 0 &&
      targetOriginUrl &&
      ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.includes(targetOriginUrl.hostname) &&
      contentType &&
      contentType.includes('text/html');

    if (!shouldInjectScripts) {
      return response;
    }

    targetOrigin = targetOriginUrl!.origin;
    let html = await response.text();

    html = html.replace(
      '<head>',
      `<head><script data-target-origin="${targetOrigin}">${buildRoutingScript({
        targetOrigin,
      })}</script>`
    );

    html = html.replace(
      '<body>',
      `<body><script data-target-origin="${targetOrigin}">${buildResizingScript(
        { targetOrigin }
      )}</script>`
    );

    const headers = new Headers(response.headers);
    headers.delete('X-Frame-Options');
    headers.set(
      'Content-Security-Policy',
      buildContentSecurityPolicyHeader(targetOriginUrl!)
    );

    return new Response(html, {
      headers,
    });
  },
} satisfies ExportedHandler<Env>;

function buildContentSecurityPolicyHeader(targetOriginUrl: URL) {
  // NB: The target origin below is authorized to embed the microapp.
  const allowedOrigins = [targetOriginUrl.origin];

  return `frame-ancestors 'self' ${allowedOrigins.join(' ')}`;
}
