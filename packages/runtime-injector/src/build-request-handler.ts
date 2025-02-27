import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  getResizingScriptBuilder,
  getRoutingScriptBuilder,
  MICROAPP_URL_PARAM_NAMES,
} from '@microapp-io/runtime';
import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';

const buildResizingScript = getResizingScriptBuilder();
const buildRoutingScript = getRoutingScriptBuilder();

export function buildRequestHandler(): {
  shouldHandleRequest: (request: Request) => boolean;
  handle: (request: Request, response: Response) => Response;
} {
  function handle(request: Request, response: Response): Response {
    const isHtmlContentType = doesRequestHaveContentType({
      request: response,
      contentType: 'text/html',
    });

    if (!isHtmlContentType) {
      return response;
    }

    const headers = buildResponseHeaders({
      request,
      response,
    });

    const { origin: targetOrigin } =
      getAllowedTargetOriginUrlByRequestOrThrow(request);

    const transformedResponse = new Response(response.body, {
      ...response,
      headers,
    });

    return (
      new HTMLRewriter()
        // 0) Inject runtime comment element at the beginning of the HTML
        .on('html', new InjectRuntimeCommentElementHandler())
        // 1) Remove any existing <meta name="robots" ...>
        .on('meta[name="robots"]', new RemoveElementHandler())
        // 2) Add our <meta name="robots" content="noindex, nofollow"> at the beginning of <head>
        .on('head', new InsertNoIndexNoFollowMetaRobotsHandler())
        // 3) Inject routing script at the beginning of <head>
        .on(
          'head',
          new InjectScriptWithDataOriginHandler(
            buildRoutingScript({ targetOrigin }),
            targetOrigin
          )
        )
        // 4) Inject resizing script at the beginning of <body>
        .on(
          'body',
          new InjectScriptWithDataOriginHandler(
            buildResizingScript({ targetOrigin }),
            targetOrigin
          )
        )
        .transform(transformedResponse)
    );
  }

  function shouldHandleRequest(request: Request): boolean {
    const requestUrl = new URL(request.url);
    const isUrlTargetedToInjectUrl = ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.some(
      (allowedHostname) =>
        requestUrl.hostname === allowedHostname ||
        requestUrl.hostname.endsWith(`.${allowedHostname}`)
    );

    return isUrlTargetedToInjectUrl && isTargetOriginOfRequestAllowed(request);
  }

  function isTargetOriginOfRequestAllowed(request: Request) {
    const targetOriginUrl = getAllowedTargetOriginUrlByRequest(request);
    return (
      !!targetOriginUrl &&
      ALLOWED_MICROAPP_ORIGIN_HOSTNAMES.includes(targetOriginUrl.hostname)
    );
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

  function doesRequestHaveContentType({
    request,
    contentType,
  }: {
    request: Request | Response;
    contentType: string;
  }): boolean {
    const headerContentType = request.headers.get('content-type');
    return !!headerContentType && headerContentType.includes(contentType);
  }

  function buildResponseHeaders({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }): Headers {
    const headers = new Headers(response.headers);
    headers.delete('X-Frame-Options');
    headers.set(
      'Content-Security-Policy',
      buildContentSecurityPolicyHeader(request)
    );

    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return headers;
  }

  function buildContentSecurityPolicyHeader(request: Request): string {
    const allowedOrigins = [];

    if (isTargetOriginOfRequestAllowed(request)) {
      const { origin: targetOrigin } =
        getAllowedTargetOriginUrlByRequestOrThrow(request);

      allowedOrigins.push(targetOrigin);
    }

    if (allowedOrigins.length === 0) {
      return `frame-ancestors 'self'`;
    }

    return `frame-ancestors 'self' ${allowedOrigins.join(' ')}`;
  }

  function getAllowedTargetOriginUrlByRequestOrThrow(request: Request): URL {
    const targetOriginUrl = getAllowedTargetOriginUrlByRequest(request);

    if (!targetOriginUrl) {
      throw new Error(
        '[runtime-injector] Target origin URL not found in the request URL'
      );
    }

    return targetOriginUrl;
  }

  class InjectRuntimeCommentElementHandler
    implements HTMLRewriterElementContentHandlers
  {
    element(html: Element) {
      html.prepend(`<!-- Injected by Microapp.io at ${new Date()} -->`, {
        html: true,
      });
    }
  }

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

  return {
    shouldHandleRequest,
    handle,
  };
}
