import { getAllowedTargetOriginUrlByRequest } from './get-allowed-target-origin-url-by-request';

export function getAllowedTargetOriginUrlByRequestOrThrow(
  request: Request
): URL {
  const targetOriginUrl = getAllowedTargetOriginUrlByRequest(request);

  if (!targetOriginUrl) {
    throw new Error('Target origin URL not found in the request URL');
  }

  return targetOriginUrl;
}
