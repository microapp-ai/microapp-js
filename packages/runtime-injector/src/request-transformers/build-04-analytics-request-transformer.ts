import type {
  RequestTransformer,
  RequestTransformerBuilderInput,
  RequestTransformerInput,
} from '../build-request-transformer';

export function build04AnalyticsRequestTransformer({
  env,
  debug,
  app,
}: RequestTransformerBuilderInput): RequestTransformer {
  async function transform({
    rewriter,
  }: RequestTransformerInput): Promise<void> {
    const websiteId = app?.analyticsWebsiteId;

    if (!websiteId) {
      return;
    }

    const analyticsScript = getAnalyticsScript(websiteId);

    rewriter.on('head', {
      element(element) {
        element.append(analyticsScript, { html: true });
      },
    });
  }

  function getAnalyticsScript(websiteId: string) {
    return `<script async defer data-website-id="${websiteId}" src="${env.ANALYTICS_SCRIPT_URL}"></script>`;
  }

  return {
    transform,
  };
}
