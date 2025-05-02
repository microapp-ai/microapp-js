export interface Env {
  CACHE: KVNamespace;
  MICROAPP_API_URL: string;
  MICROAPP_API_KEY: string;
  ANALYTICS_SCRIPT_URL: string;
}

export type MicroappMarketplaceApp = {
  source: 'api' | 'marketplace';
  marketplacePublicAppId: string | null;
  marketplacePrivateAppId: string | null;
  apiId: string | null;
  analyticsWebsiteId: string | null;
  publicUrl: string;
  privateUrl: string | null;
  isPublishedOnMarketplace: boolean;
  marketplaceUrl: string | null;
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
  debug: boolean;
  app: MicroappMarketplaceApp | null;
};

export type RequestHTMLRewriterBuilder = (
  input: RequestHTMLRewriterBuilderInput
) => RequestHTMLRewriter;

export type RequestTransformer = {
  transform: (request: Request) => Promise<Request>;
};
