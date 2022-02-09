# @ruleenginejs/runtime

## Installation

```bash
npm install @ruleenginejs/runtime
```

## Usage

```js
const {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep,
  CompositeStep
} = require("@ruleenginejs/runtime");

const pipeline = new Pipeline();
const start = new StartStep();
const end = new EndStep();
const step = new SingleStep({
  handler: (context, next) => {
    next();
  }
});

start.connectTo(step);
step.connectTo(end);

pipeline.add(start, end, step);

const context = {};
pipeline.execute(context).catch(e => console.error(e));
```

## Documentation

### Step handlers

```js
handler: (context, next) => {
  next();
}
```

```js
handler: (context, port, next) => {
  next();
}
```

```js
handler: (context, port, props, next) => {
  next();
}
```

```js
handler: (err, context, port, props, next) => {
  next();
}
```

### Pipeline events

- `execute_start`
- `execute_error`
- `execute_end`
- `step_begin`
- `step_end`
- `step_error`

## License

Licensed under the [MIT License](./LICENSE).
