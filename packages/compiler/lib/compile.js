const codegen = require("./codegen");
const requireFromString = require("require-from-string");

function compile(input, options = {}) {
  return requireFromString(codegen(input, options));
}

module.exports = compile;
