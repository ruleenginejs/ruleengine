const { generateCode } = require("..");
const path = require("path");

const fixtures = path.join(__dirname, "fixtures");
const pipelines = path.join(fixtures, "pipelines");

describe("code generation", () => {
  const genOpts = { runtimeModule: "runtimemodule" };

  it("bad input", () => {
    const expectedErr = /input must be an object/;
    expect(() => generateCode(null)).toThrowError(expectedErr);
    expect(() => generateCode(undefined)).toThrowError(expectedErr);
    expect(() => generateCode(1)).toThrowError(expectedErr);
    expect(() => generateCode([])).toThrowError(expectedErr);
    expect(() => generateCode(false)).toThrowError(expectedErr);
    expect(() => generateCode("str")).toThrowError(expectedErr);
  });

  it("duplicate steps", () => {
    expect(() => generateCode(getDefinition("duplicate-ids"))).toThrowError(/duplicate step identifiers/);
  });

  it("unknown type", () => {
    expect(() => generateCode(getDefinition("unknown-type"))).toThrowError(/unknown step type/);
  });

  it("empty", () => {
    const code = generateCode(getDefinition("empty"), genOpts);
    expect(code).toMatchSnapshot();
  });

  it("steps", () => {
    const code = generateCode(getDefinition("steps"), {
      ...genOpts,
      baseDir: "./fixtures/pipelines"
    });
    expect(code).toMatchSnapshot();
  });

  it("$require", () => {
    const code = generateCode(getDefinition("$require"), {
      ...genOpts,
      baseDir: "./fixtures/pipelines"
    });
    expect(code).toMatchSnapshot();
  });

  it("step connections", () => {
    const code = generateCode(getDefinition("step-connections"), genOpts);
    expect(code).toMatchSnapshot();
  });

  it("should throw error when connection item is no object", () => {
    expect(() => generateCode(getDefinition("bad-connection"))).toThrowError(/connection expected as object/);
  });

  it("should throw error when connection reference unknown step id", () => {
    expect(() => generateCode(getDefinition("dst-id-no"))).toThrowError(/step not found with id/);
  });

  it("no exists start id for composite", () => {
    expect(() => generateCode(getDefinition("composite-start-no"))).toThrowError(/start id doesn't exists for composite/);
  });

  it("no exists end id for composite", () => {
    expect(() => generateCode(getDefinition("composite-end-no"))).toThrowError(/end id doesn't exists for composite/);
  });

  it("composite steps", () => {
    const code = generateCode(getDefinition("composite-steps"), genOpts);
    expect(code).toMatchSnapshot();
  });

  it("composite substeps", () => {
    const code = generateCode(getDefinition("composite-recursive"), genOpts);
    expect(code).toMatchSnapshot();
  });
});

function getDefinition(id) {
  return require(path.join(pipelines, `${id}.json`));
}
