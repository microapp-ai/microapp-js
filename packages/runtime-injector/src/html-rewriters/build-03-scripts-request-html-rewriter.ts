import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';
import {
  getResizingScriptBuilder,
  getRoutingScriptBuilder,
} from '@microapp-io/runtime';
import { getAllowedTargetOriginUrlByRequestOrThrow } from '../utils';
import type { RequestHTMLRewriter, RequestHTMLRewriterInput } from '../types';

const buildResizingScript = getResizingScriptBuilder();
const buildRoutingScript = getRoutingScriptBuilder();

export function build03ScriptsRequestHtmlRewriter(): RequestHTMLRewriter {
  function rewrite({ request, htmlRewriter }: RequestHTMLRewriterInput): void {
    const { origin: targetOrigin } =
      getAllowedTargetOriginUrlByRequestOrThrow(request);

    htmlRewriter
      // 1) Inject routing script at the beginning of <head>
      .on(
        'head',
        new InjectScriptWithDataOriginHandler(
          buildRoutingScript({ targetOrigin }),
          targetOrigin,
          true
        )
      )
      // 2) Inject resizing script at the beginning of <body>
      .on(
        'body',
        new InjectScriptWithDataOriginHandler(
          buildResizingScript({ targetOrigin }),
          targetOrigin,
          false
        )
      );
  }

  return {
    rewrite,
  };
}

class InjectScriptWithDataOriginHandler
  implements HTMLRewriterElementContentHandlers
{
  constructor(
    private readonly scriptContent: string,
    private readonly targetOrigin: string,
    private readonly prepend: boolean
  ) {
    this.scriptContent = scriptContent;
    this.targetOrigin = targetOrigin;
  }

  element(el: Element) {
    const script = `<script data-target-origin="${this.targetOrigin}">${this.scriptContent}</script>`;

    if (this.prepend) {
      el.prepend(script, { html: true });
      return;
    }

    el.append(script, { html: true });
  }
}
