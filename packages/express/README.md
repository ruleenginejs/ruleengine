# @ruleenginejs/express

## Installation

```bash
npm install @ruleenginejs/express
```

## Usage

```js
const express = require("express");
const ruleengine = require("@ruleenginejs/express");

const app = express();

app.use("/rules/:id", ruleengine({
  "rule": require("./pipeline")
}))

app.listen(8080);
```

## Documentation

### Custom id param

```js
app.use("/rules/:ruleId", ruleengine(rules, {
  idParam: "ruleId"
})
```

### Enable debug

```js
app.use("/rules/:id", ruleengine(rules, {
  debug: app.get("env") === "development"
})
```

## License

Licensed under the [MIT License](./LICENSE).
