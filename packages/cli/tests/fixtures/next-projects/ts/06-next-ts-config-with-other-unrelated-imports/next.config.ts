// @ts-ignore
import SomeOtherPlugin from 'some-other-plugin';

// NB: We do this call below so that ESLint doesn't remove the import it
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
SomeOtherPlugin;

export default {
  webpack: (config) => {
    return config;
  },
};
