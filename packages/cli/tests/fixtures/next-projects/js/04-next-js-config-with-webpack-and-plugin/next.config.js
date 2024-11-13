const { MicroappNextFederationPlugin } = require('@microapp-io/build');

module.exports = {
  webpack: (config) => {
    config.plugins.push(new MicroappNextFederationPlugin());
    return config;
  },
};
