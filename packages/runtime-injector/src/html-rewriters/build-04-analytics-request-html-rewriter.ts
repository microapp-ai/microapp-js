import type {
  RequestHTMLRewriter,
  RequestHTMLRewriterBuilderInput,
  RequestHTMLRewriterInput,
} from '../types';
import { buildLogger } from '../utils';

export function build04AnalyticsRequestHtmlRewriter({
  env,
  app,
  debug,
}: RequestHTMLRewriterBuilderInput): RequestHTMLRewriter {
  const logger = buildLogger({
    identifier: 'analytics-request-html-rewriter',
    debug,
  });

  async function rewrite({
    htmlRewriter,
  }: RequestHTMLRewriterInput): Promise<void> {
    const websiteId = app?.analyticsWebsiteId;

    if (!websiteId) {
      logger.warn('No analytics website ID found for app');
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
