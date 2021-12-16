# @ruleenginejs/schema

## Installation

```bash
npm install @ruleenginejs/schema
```

## Usage

```js
const schema = require("@ruleenginejs/schema")
const validate = schema(schema.SCHEMAS.PIPELINE)

if (!validate(data)) console.log(validate.errors)
```

## Schemas
- [pipeline-schema.json](./schema/pipeline-schema.json)

## License

Licensed under the [MIT License](./LICENSE).
