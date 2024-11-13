import { MicroappNextFederationPlugin } from '@microapp-io/build';

// NB: We do this call below so that ESLint doesn't remove the import it
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
MicroappNextFederationPlugin;

export default {
  webpack: (config) => {
    return config;
  },
};
