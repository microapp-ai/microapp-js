export class AuthConfig {
  static readonly DEFAULT_CONFIG: AuthConfigParams = {
    baseUrl: "https://www.microapp.io",
  };

  private config: AuthConfigParams;

  constructor(config?: Partial<AuthConfigParams>) {
    this.config = Object.assign({}, AuthConfig.DEFAULT_CONFIG, config);
  }

  buildUrl({
    path,
    query,
  }: {
    path?: string;
    query?: { [key: string]: any };
  }): string {
    const parsedUrl = new URL(this.config.baseUrl);

    if (path) {
      parsedUrl.pathname = path;
    }

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        parsedUrl.searchParams.append(key, value);
      }
    }

    return parsedUrl.toString();
  }
}

export type AuthConfigParams = {
  baseUrl: string;
};
