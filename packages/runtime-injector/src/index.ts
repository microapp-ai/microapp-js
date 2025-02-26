import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  getResizingScriptBuilder,
  getRoutingScriptBuilder,
  MICROAPP_URL_PARAM_NAMES,
} from '@microapp-io/runtime';
import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';

const buildResizingScript = getResizingScriptBuilder();
const buildRoutingScript = getRoutingScriptBuilder();

export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);
    const contentType = response.headers.get('content-type');
    const isHtmlContentType = contentType && contentType.includes('text/html');

    if (!isHtmlContentType) {
      return response;
    }

    const requestUrl = new URL(request.url);
    const isUrlTargetedToInjectUrl = ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.some(
      (allowedHostname) =>
        requestUrl.hostname === allowedHostname ||
        requestUrl.hostname.endsWith(`.${allowedHostname}`)
    );

    const targetOriginUrl = getAllowedTargetOriginUrlByRequest(request);

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

    headers.set('X-Robots-Tag', 'noindex, nofollow');

    const targetOrigin = targetOriginUrl.origin;
    const routingScript = buildRoutingScript({ targetOrigin });
    const resizingScript = buildResizingScript({ targetOrigin });

    const newResponse = new Response(response.body, {
      headers,
      status: response.status,
    });

    return (
      new HTMLRewriter()
        // 1) Remove any existing <meta name="robots" ...>
        .on('meta[name="robots"]', new RemoveElementHandler())
        // 2) Add our <meta name="robots" content="noindex, nofollow"> inside <head>
        .on('head', new InsertNoIndexNoFollowMetaRobotsHandler())
        // 3) Inject scripts in <head> and <body> or wherever you like
        .on(
          'head',
          new InjectScriptWithDataOriginHandler(routingScript, targetOrigin)
        )
        .on(
          'body',
          new InjectScriptWithDataOriginHandler(resizingScript, targetOrigin)
        )
        .transform(newResponse)
    );
  },
};

class RemoveElementHandler implements HTMLRewriterElementContentHandlers {
  element(el: Element) {
    el.remove();
  }
}

class InsertNoIndexNoFollowMetaRobotsHandler
  implements HTMLRewriterElementContentHandlers
{
  element(head: Element) {
    head.prepend('<meta name="robots" content="noindex, nofollow">', {
      html: true,
    });
  }
}

class InjectScriptWithDataOriginHandler
  implements HTMLRewriterElementContentHandlers
{
  constructor(
    private readonly scriptContent: string,
    private readonly targetOrigin: string
  ) {
    this.scriptContent = scriptContent;
    this.targetOrigin = targetOrigin;
  }

  element(el: Element) {
    el.append(
      `<script data-target-origin="${this.targetOrigin}">${this.scriptContent}</script>`,
      { html: true }
    );
  }
}

function buildContentSecurityPolicyHeader({
  targetOriginUrl,
  isTargetOriginUrlAllowed,
}: {
  targetOriginUrl: URL | null;
  isTargetOriginUrlAllowed: boolean;
}): string {
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

  let targetOriginUrl = null;
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
