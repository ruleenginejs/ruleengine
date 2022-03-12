# ruleengine

> Pipeline implementation of steps with handlers.

## Installation

```bash
# install with npm
npm install @ruleenginejs/runtime

# install with yarn
yarn add @ruleenginejs/runtime
```

## Usage

foo.js

```javascript
import {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep,
} from "@ruleenginejs/runtime";

const pipeline = new Pipeline();
const start = new StartStep();
const end = new EndStep();
const step = new SingleStep({
  handler: (context, next) => {
    next();
  },
});

start.connectTo(step);
step.connectTo(end);

pipeline.add(start, end, step);

export default pipeline;
```

App.js

```js
import foo from "foo.js";

const context = {};
foo.execute(context).catch((e) => console.error(e));
```

## License

Licensed under the [MIT License](./LICENSE).
