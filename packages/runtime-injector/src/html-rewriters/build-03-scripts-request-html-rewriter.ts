import type { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2023-07-01/index';
import {
  getResizingScriptBuilder,
  getRoutingScriptBuilder,
} from '@microapp-io/runtime';
import { getAllowedTargetOriginUrlByRequestOrThrow } from '../utils';
import type {
  RequestHTMLRewriter,
  RequestHTMLRewriterBuilderInput,
  RequestHTMLRewriterInput,
} from '../types';

const buildResizingScript = getResizingScriptBuilder();
const buildRoutingScript = getRoutingScriptBuilder();

export function build03ScriptsRequestHtmlRewriter({
  app,
}: RequestHTMLRewriterBuilderInput): RequestHTMLRewriter {
  function rewrite({ request, htmlRewriter }: RequestHTMLRewriterInput): void {
    const { origin: targetOrigin } =
      getAllowedTargetOriginUrlByRequestOrThrow(request);

    // TODO: Throw error if app is not defined when we add all missing apps to the API
    const appId = app?.id || '__MICROAPP_NOT_FOUND__';

    htmlRewriter
      // 1) Inject routing script at the beginning of <head>
      .on(
        'head',
        new InjectScriptWithDataOriginHandler(
          buildRoutingScript({ appId, targetOrigin }),
          targetOrigin,
          true
        )
      )
      // 2) Inject resizing script at the beginning of <body>
      .on(
        'body',
        new InjectScriptWithDataOriginHandler(
          buildResizingScript({ appId, targetOrigin }),
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
