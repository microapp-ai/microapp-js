export interface Env {
  CACHE: KVNamespace;
  MICROAPP_API_URL: string;
  MICROAPP_API_KEY: string;
  ANALYTICS_SCRIPT_URL: string;
}

export type MicroappApp = {
  id: string;
  slug: string;

  // TODO: Replace domainName with publicUrl when the API is updated.
  domainName: string;
  // publicUrl: string;

  analyticsWebsiteId: string;
};

export type RequestHTMLRewriterInput = {
  request: Request;
  htmlRewriter: HTMLRewriter;
};

export type RequestHTMLRewriterOutput = void | Promise<void>;

export type RequestHTMLRewriter = {
  rewrite: (input: RequestHTMLRewriterInput) => RequestHTMLRewriterOutput;
};

export type RequestHTMLRewriterBuilderInput = {
  env: Env;
  debug?: boolean;
  app: MicroappApp | null;
};

export type RequestHTMLRewriterBuilder = (
  input: RequestHTMLRewriterBuilderInput
) => RequestHTMLRewriter;

export type RequestTransformer = {
  transform: (request: Request) => Promise<Request>;
};
