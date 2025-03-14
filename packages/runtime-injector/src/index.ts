import type { Env } from './types';
import { buildProtocolRequestOptimizer } from './create-request-protocol-optimizer';
import type { RequestTransformerBuilder } from './build-request-transformer';
import { buildRequestTransformer } from './build-request-transformer';
import {
  build01MetaRequestTransformer,
  build02SeoRequestTransformer,
  build03ScriptsRequestTransformer,
  build04AnalyticsRequestTransformer,
} from './request-transformers';

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    // NB: This is a debug flag that can be used to force optimization for a specific IP address.
    // const ip = request.headers.get('cf-connecting-ip');
    // const debug = ip === '2804:d45:3719:2300:9073:a958:1207:cc52';
    const debug = false;

    const protocolRequestOptimizer = buildProtocolRequestOptimizer({
      env,
      debug,
    });

    const requestUrl = await protocolRequestOptimizer.buildRequestUrl(request);
    const response = await fetch(requestUrl, request);
    await protocolRequestOptimizer.handleResponse(response);

    const requestTransformer = buildRequestTransformer({ debug });

    if (!requestTransformer.shouldTransformRequest(request)) {
      return response;
    }

    const transformers: RequestTransformerBuilder[] = [
      build01MetaRequestTransformer,
      build02SeoRequestTransformer,
      build03ScriptsRequestTransformer,
      build04AnalyticsRequestTransformer,
    ];

    return requestTransformer.transform(request, response, {
      env,
      transformers,
    });
  },
};

export default worker;
