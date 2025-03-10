import type {
  RequestTransformer,
  RequestTransformerInput,
} from '../build-request-transformer';
import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';

export function build02SeoRequestTransformer(): RequestTransformer {
  function transform({ rewriter }: RequestTransformerInput): void {
    rewriter
      // 1) Remove any existing <meta name="robots" ...>
      .on('meta[name="robots"]', new RemoveElementHandler())
      // 2) Add our <meta name="robots" content="noindex, nofollow"> at the beginning of <head>
      .on('head', new InsertNoIndexNoFollowMetaRobotsHandler());
  }

  return {
    transform,
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
