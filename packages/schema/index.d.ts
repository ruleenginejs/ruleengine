import type { Options, ValidateFunction, default as Ajv } from "ajv";

declare function schema<T = unknown>(schemaId: string, options: Options): SchemaValidateFunction<T>;

declare namespace schema {
  export { SCHEMA_IDS as SCHEMAS };
}

interface SchemaValidateFunction<T = unknown> extends ValidateFunction<T> {
  ajv: Ajv
}

declare const SCHEMA_IDS: Readonly<{
  PIPELINE: string;
}>;

export = schema;
