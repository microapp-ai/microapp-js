// @ts-ignore
import SomeOtherPlugin from 'some-other-plugin';

export default {
  webpack: (config) => {
    config.plugins.push(new SomeOtherPlugin());
    return config;
  },
};
