const SomeOtherPlugin = require('some-other-plugin');

module.exports = {
  webpack: (config) => {
    config.plugins.push(new SomeOtherPlugin());
    return config;
  },
};
