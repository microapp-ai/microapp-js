import { ALLOWED_MICROAPP_ORIGIN_HOSTNAMES } from '@microapp-io/runtime';
import {
  getAllowedTargetOriginUrlByRequest,
  getAllowedTargetOriginUrlByRequestOrThrow,
} from './utils';
import type { Env } from './types';

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
    }
  ) => Promise<Response>;
} {
  async function handle(
    request: Request,
    response: Response,
    {
      env,
      transformers = [],
    }: {
      env: Env;
      transformers?: RequestTransformerBuilder[];
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
      const transformer = transformerBuilder({ env, debug });
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

  return {
    shouldTransformRequest: shouldHandleRequest,
    transform: handle,
  };
}
