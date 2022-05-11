const { compile } = require('..');
const { Pipeline } = require('@ruleenginejs/runtime');

describe('compile', () => {
  it('compile with empty input', () => {
    const actualPipeline = compile(
      {},
      { runtimeModule: '@ruleenginejs/runtime' }
    );
    const emptyPipeline = new Pipeline();
    expect(JSON.stringify(actualPipeline)).toBe(JSON.stringify(emptyPipeline));
  });
});
