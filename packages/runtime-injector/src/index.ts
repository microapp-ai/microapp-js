import type {
  Env,
  RequestHTMLRewriterBuilder,
  RequestTransformer,
} from './types';
import { buildRequestRewriter } from './build-request-rewriter';
import {
  build01MetaRequestHtmlRewriter,
  build02SeoRequestHtmlRewriter,
  build03ScriptsRequestHtmlRewriter,
  build04AnalyticsRequestHtmlRewriter,
} from './html-rewriters';
import { buildAppRequestTransformer } from './build-app-request-transformer';
import { buildProtocolRequestTransformer } from './build-protocol-request-transformer';

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    // NB: This is a debug flag that can be used to force optimization for a specific IP address.
    // const ip = request.headers.get('cf-connecting-ip');
    // const debug = ip === '2804:d45:3719:2300:2133:ae1:10ce:87bf';
    const debug = false;

    const appRequestTransformer = buildAppRequestTransformer({ env, debug });
    const protocolRequestTransformer = buildProtocolRequestTransformer({
      env,
      debug,
    });

    const transformedRequest = await transformRequest({
      request,
      transformers: [appRequestTransformer, protocolRequestTransformer],
    });

    const response = await fetch(transformedRequest, request);
    await protocolRequestTransformer.handleResponse(response);

    const requestRewriter = buildRequestRewriter({ debug });

    if (!requestRewriter.shouldRewrite(request)) {
      return response;
    }

    const rewriters: RequestHTMLRewriterBuilder[] = [
      build01MetaRequestHtmlRewriter,
      build02SeoRequestHtmlRewriter,
      build03ScriptsRequestHtmlRewriter,
      build04AnalyticsRequestHtmlRewriter,
    ];

    const app = await appRequestTransformer.getAppByRequest(request);
    return requestRewriter.rewrite(request, response, {
      env,
      rewriters,
      app,
    });
  },
};

async function transformRequest({
  request,
  transformers,
}: {
  request: Request;
  transformers: RequestTransformer[];
}): Promise<Request> {
  for (const transformer of transformers) {
    request = await transformer.transform(request);
  }

  return request;
}

export default worker;
