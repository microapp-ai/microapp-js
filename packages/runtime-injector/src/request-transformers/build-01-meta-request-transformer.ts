import type {
  RequestTransformer,
  RequestTransformerInput,
} from '../build-request-transformer';
import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';

export function build01MetaRequestTransformer(): RequestTransformer {
  function transform({ rewriter }: RequestTransformerInput): void {
    rewriter
      // 0) Inject runtime comment element at the beginning of the HTML
      .on('html', new InjectRuntimeCommentElementHandler());
  }

  return {
    transform,
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
