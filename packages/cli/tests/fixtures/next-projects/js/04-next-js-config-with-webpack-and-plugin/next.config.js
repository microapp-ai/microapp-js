const { MicroappNextFederationPlugin } = require('@microapp-io/scripts');

module.exports = {
  webpack: (config) => {
    config.plugins.push(new MicroappNextFederationPlugin());
    return config;
  },
};
