import { MicroappNextFederationPlugin } from '@microapp-io/build';

export default {
  webpack: (config) => {
    config.plugins.push(new MicroappNextFederationPlugin());
    return config;
  },
};
