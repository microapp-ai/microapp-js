/* eslint-env node */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./umd/microapp-react.production.min.js");
} else {
  module.exports = require("./umd/microapp-react.development.js");
}
