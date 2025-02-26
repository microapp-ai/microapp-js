import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  getResizingScriptBuilder,
  getRoutingScriptBuilder,
} from '@microapp-io/runtime';

const buildResizingScript = getResizingScriptBuilder();
const buildRoutingScript = getRoutingScriptBuilder();

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const response = await fetch(request);
    const url = new URL(request.url);
    const targetOrigin = url.searchParams.get('__microappTargetOrigin');
    const targetOriginUrl = targetOrigin ? new URL(targetOrigin) : null;
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

    let html = await response.text();

    html = html.replace(
      '<head>',
      `<head><script data-target-origin="${targetOrigin}">${buildRoutingScript({
        targetOrigin: targetOrigin!,
      })}</script>`
    );

    html = html.replace(
      '<body>',
      `<body><script data-target-origin="${targetOrigin}">${buildResizingScript(
        { targetOrigin: targetOrigin! }
      )}</script>`
    );

    return new Response(html, {
      headers: response.headers,
    });
  },
} satisfies ExportedHandler<Env>;
