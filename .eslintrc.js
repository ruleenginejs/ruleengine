module.exports = {
  plugins: [
    "jest"
  ],
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
    "plugin:jest/recommended"
  ],
  env: {
    es6: true,
    node: true,
    "jest/globals": true
  },
  rules: {
    eqeqeq: [
      "error",
      "always"
    ],
    "node/exports-style": [
      "error",
      "module.exports"
    ],
    "node/file-extension-in-import": [
      "error",
      "always"
    ],
    "node/prefer-global/buffer": [
      "error",
      "always"
    ],
    "node/prefer-global/console": [
      "error",
      "always"
    ],
    "node/prefer-global/process": [
      "error",
      "always"
    ],
    "node/prefer-global/url-search-params": [
      "error",
      "always"
    ],
    "node/prefer-global/url": [
      "error",
      "always"
    ],
    "node/prefer-promises/dns": "error",
    "node/prefer-promises/fs": "error"
  }
}
