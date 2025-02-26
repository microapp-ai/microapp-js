import type { Env } from './types';
import { buildProtocolRequestOptimizer } from './create-request-protocol-optimizer';
import { buildRequestHandler } from './build-request-handler';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestHandler = buildRequestHandler();

    if (!requestHandler.shouldHandleRequest(request)) {
      return fetch(request);
    }

    const protocolRequestOptimizer = buildProtocolRequestOptimizer({
      env,
    });

    const requestUrl = await protocolRequestOptimizer.buildRequestUrl(request);
    const response = await fetch(requestUrl, request);
    await protocolRequestOptimizer.handleResponse(response);

    return requestHandler.handle(request, response);
  },
};
