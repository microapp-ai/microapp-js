import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';
import type {
  RequestHTMLRewriter,
  RequestHTMLRewriterBuilderInput,
  RequestHTMLRewriterInput,
} from '../types';

export function build02SeoRequestHtmlRewriter({
  app,
}: RequestHTMLRewriterBuilderInput): RequestHTMLRewriter {
  function rewrite({ htmlRewriter }: RequestHTMLRewriterInput): void {
    htmlRewriter
      // 1) Remove any existing <meta name="robots" ...>
      .on('meta[name="robots"]', new RemoveElementHandler())
      // 2) Add our <meta name="robots" content="noindex, nofollow"> at the beginning of <head>
      .on('head', new InsertNoIndexNoFollowMetaRobotsHandler())
      // 3) Remove any existing <link rel="canonical" ...>
      .on('link[rel="canonical"]', new RemoveElementHandler())
      // 4) Add our <link rel="canonical" ...> at the beginning of <head>
      .on('head', new InsertCanonicalLinkHandler({ app }));
  }

  return {
    rewrite,
  };
}

class RemoveElementHandler implements HTMLRewriterElementContentHandlers {
  element(el: Element) {
    el.remove();
  }
}

class InsertNoIndexNoFollowMetaRobotsHandler
  implements HTMLRewriterElementContentHandlers
{
  element(head: Element) {
    head.prepend('<meta name="robots" content="noindex, nofollow">', {
      html: true,
    });
  }
}

class InsertCanonicalLinkHandler implements HTMLRewriterElementContentHandlers {
  private readonly app: RequestHTMLRewriterBuilderInput['app'];

  constructor({ app }: { app: RequestHTMLRewriterBuilderInput['app'] }) {
    this.app = app;
  }

  element(head: Element) {
    if (!this.app) {
      return;
    }

    head.prepend(`<link rel="canonical" href="${this.app.marketplaceUrl}" />`, {
      html: true,
    });
  }
}
