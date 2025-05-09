const fs = require('fs');
const path = require('path');

module.exports = function rollup(options) {
  return ['auth', 'react', 'runtime', 'runtime-injector', 'user-preferences']
    .flatMap((dir) => {
      let configPath = path.join('packages', dir, 'rollup.config.js');
      try {
        fs.readFileSync(configPath);
      } catch (e) {
        return null;
      }
      let packageBuild = require(`.${path.sep}${configPath}`);
      return packageBuild(options);
    })
    .filter((p) => p);
};
