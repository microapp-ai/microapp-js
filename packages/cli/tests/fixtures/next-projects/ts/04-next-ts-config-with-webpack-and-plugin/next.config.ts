import { MicroappNextFederationPlugin } from '@microapp-io/scripts';

export default {
  webpack: (config) => {
    config.plugins.push(new MicroappNextFederationPlugin());
    return config;
  },
};
