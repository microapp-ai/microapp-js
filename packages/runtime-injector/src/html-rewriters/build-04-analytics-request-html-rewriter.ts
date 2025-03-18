import type {
  RequestHTMLRewriter,
  RequestHTMLRewriterBuilderInput,
  RequestHTMLRewriterInput,
} from '../types';

export function build04AnalyticsRequestHtmlRewriter({
  env,
  app,
}: RequestHTMLRewriterBuilderInput): RequestHTMLRewriter {
  async function rewrite({
    htmlRewriter,
  }: RequestHTMLRewriterInput): Promise<void> {
    const websiteId = app?.analyticsWebsiteId;

    if (!websiteId) {
      return;
    }

    const analyticsScript = getAnalyticsScript(websiteId);

    htmlRewriter.on('head', {
      element(element) {
        element.append(analyticsScript, { html: true });
      },
    });
  }

  function getAnalyticsScript(websiteId: string) {
    return `<script async defer data-website-id="${websiteId}" src="${env.ANALYTICS_SCRIPT_URL}"></script>`;
  }

  return {
    rewrite,
  };
}
