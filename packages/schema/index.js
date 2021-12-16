const Ajv = require("ajv").default;
const addFormats = require("ajv-formats").default;

const SCHEMA_IDS = Object.freeze({
  PIPELINE: "https://github.com/ruleenginejs/ruleengine/packages/schema/blob/master/schema/pipeline-schema.json"
});

const SCHEMA_FILES = {
  [SCHEMA_IDS.PIPELINE]: require("./schema/pipeline-schema.json"),
};

function schema(schemaId, options) {
  if (!(schemaId in SCHEMA_FILES)) {
    throw new Error(`schemaId doesn't exists: ${schemaId}`);
  }

  const ajv = new Ajv(options);
  addFormats(ajv);

  const validate = ajv.compile(SCHEMA_FILES[schemaId]);
  validate.ajv = ajv;

  return validate;
}

schema.SCHEMAS = SCHEMA_IDS;

module.exports = schema;
