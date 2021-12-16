# @ruleenginejs/compiler

## Installation

```bash
npm install @ruleenginejs/compiler
```

## Usage

### Compile module

```js
const { compile } = require("@ruleenginejs/compiler");

const pipeline = compile(input, options);
pipeline.execute();
```

### Generate code

```js
const { generateCode } = require("@ruleenginejs/compiler");

const code = generateCode(input, options);
```

## License

Licensed under the [MIT License](./LICENSE).
