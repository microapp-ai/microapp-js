import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';
import type { RequestHTMLRewriter, RequestHTMLRewriterInput } from '../types';

export function build01MetaRequestHtmlRewriter(): RequestHTMLRewriter {
  function rewrite({ htmlRewriter }: RequestHTMLRewriterInput): void {
    htmlRewriter
      // 0) Inject runtime comment element at the beginning of the HTML
      .on('html', new InjectRuntimeCommentElementHandler());
  }

  return {
    rewrite,
  };
}

class InjectRuntimeCommentElementHandler
  implements HTMLRewriterElementContentHandlers
{
  element(html: Element) {
    html.prepend(`<!-- Injected by Microapp.io at ${new Date()} -->`, {
      html: true,
    });
  }
}
