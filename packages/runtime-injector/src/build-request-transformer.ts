import {
  ALLOWED_MICROAPP_ORIGIN_HOSTNAMES,
  MICROAPP_URL_PARAM_NAMES,
} from '@microapp-io/runtime';
import {
  getAllowedTargetOriginUrlByRequest,
  getAllowedTargetOriginUrlByRequestOrThrow,
} from './utils';
import type { Env, MicroappApp } from './types';

export type RequestTransformerInput = {
  request: Request;
  rewriter: HTMLRewriter;
};

export type RequestTransformerOutput = void | Promise<void>;

export type RequestTransformer = {
  transform: ({
    request,
    rewriter,
  }: RequestTransformerInput) => RequestTransformerOutput;
};

export type RequestTransformerBuilderInput = {
  env: Env;
  debug?: boolean;
  app: MicroappApp | null;
};

export type RequestTransformerBuilder = (
  input: RequestTransformerBuilderInput
) => RequestTransformer;

export function buildRequestTransformer({ debug }: { debug?: boolean } = {}): {
  shouldTransformRequest: (request: Request) => boolean;
  transform: (
    request: Request,
    response: Response,
    {
      env,
      transformers,
    }: {
      transformers?: RequestTransformerBuilder[];
      env: Env;
      app: MicroappApp | null;
    }
  ) => Promise<Response>;
} {
  async function handle(
    request: Request,
    response: Response,
    {
      env,
      transformers = [],
      app,
    }: {
      env: Env;
      transformers?: RequestTransformerBuilder[];
      app: MicroappApp | null;
    }
  ): Promise<Response> {
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

    const transformedResponse = new Response(response.body, {
      ...response,
      headers,
      status: response.status,
    });

    const rewriter = new HTMLRewriter();

    for (const transformerBuilder of transformers) {
      const transformer = transformerBuilder({ env, debug, app });
      await transformer.transform({ request, rewriter });
    }

    return rewriter.transform(transformedResponse);
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

    // Remove the X-Frame-Options header to allow the microapp to be embedded in an iframe
    headers.delete('X-Frame-Options');
    headers.set('Content-Security-Policy', buildContentSecurityPolicyHeader());

    // Set the target origin as a cookie to allow the microapp to communicate with the parent window
    const { origin: targetOrigin } =
      getAllowedTargetOriginUrlByRequestOrThrow(request);
    headers.set(
      'Set-Cookie',
      `${MICROAPP_URL_PARAM_NAMES.TARGET_ORIGIN}=${encodeURIComponent(
        targetOrigin
      )}; Path=/; Max-Age=3600; SameSite=None; Secure`
    );

    // Prevent search engines from indexing the microapp
    headers.set('X-Robots-Tag', 'noindex, nofollow');

    return headers;
  }

  function buildContentSecurityPolicyHeader(): string {
    // NB: We are allowing all origins to embed the microapp in an iframe
    return `frame-ancestors *`;
  }

  return {
    shouldTransformRequest: shouldHandleRequest,
    transform: handle,
  };
}
