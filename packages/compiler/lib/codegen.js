const generateAst = require('./astgen');
const generate = require('@babel/generator').default;

function generateCode(input, options = {}) {
  const ast = generateAst(input, options);
  return generate(ast, options.babel).code;
}

module.exports = generateCode;
