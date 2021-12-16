# @ruleenginejs/debug

## Installation

```bash
npm install @ruleenginejs/debug
```

## Usage

```js
const debug = require("@ruleenginejs/debug")("ruleengine");

const pipeline = new Pipeline();
const logger = debug(pipeline);
await pipeline.execute();

logger.destroy();
```

### Run example

```bash
DEBUG=ruleengine node example/base.js
```

## License

Licensed under the [MIT License](./LICENSE).
