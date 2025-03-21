export class PaymentsConfig {
  static readonly DEFAULT_CONFIG: PaymentsConfigParams = {
    baseUrl: 'https://www.microapp.io',
  };

  private config: PaymentsConfigParams;

  constructor(config?: Partial<PaymentsConfigParams>) {
    this.config = Object.assign({}, PaymentsConfig.DEFAULT_CONFIG, config);
  }

  buildUrl({
    path,
    query,
  }: {
    path?: string;
    query?: { [key: string]: string };
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

export type PaymentsConfigParams = {
  baseUrl: string;
};
