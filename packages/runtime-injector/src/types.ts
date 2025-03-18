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
