import type { Env } from './types';
import { buildProtocolRequestOptimizer } from './create-request-protocol-optimizer';
import { buildRequestTransformer } from './build-request-transformer';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const protocolRequestOptimizer = buildProtocolRequestOptimizer({
      env,
    });

    const requestUrl = await protocolRequestOptimizer.buildRequestUrl(request);
    const response = await fetch(requestUrl, request);
    await protocolRequestOptimizer.handleResponse(response);

    const requestTransformer = buildRequestTransformer();

    if (!requestTransformer.shouldTransformRequest(request)) {
      return response;
    }

    return requestTransformer.transform(request, response);
  },
};
