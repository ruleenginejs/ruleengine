const t = require("@babel/types");
const kindOf = require("kind-of");
const path = require("path");

const SINGLE_STEP_CLASS = "SingleStep";
const COMPOSITE_STEP_CLASS = "CompositeStep";
const START_STEP_CLASS = "StartStep";
const END_STEP_CLASS = "EndStep";
const ERROR_STEP_CLASS = "ErrorStep";
const PIPELINE_CLASS = "Pipeline";
const PIPELINE_VAR = "pipeline";
const REQUIRE_FROM_STRING_VAR = "requireFromString";
const REQUIRE_FROM_STRING_MODULE = "require-from-string";

const STEP_CLASS_BY_TYPE = {
  "start": START_STEP_CLASS,
  "end": END_STEP_CLASS,
  "error": ERROR_STEP_CLASS,
  "single": SINGLE_STEP_CLASS,
  "composite": COMPOSITE_STEP_CLASS
};

function generateAst(input, options = {}) {
  if (kindOf(input) !== "object") {
    throw new TypeError("input must be an object");
  }

  const statements = [];

  const scope = {
    parentScope: null,
    uniqueCounter: 1,
    stepVars: {},
    global: statements,
    dep: { [REQUIRE_FROM_STRING_MODULE]: false },
    baseDir: options.baseDir
  };

  if (options.runtimeModule) {
    statements.push(generateRequire([
      SINGLE_STEP_CLASS,
      COMPOSITE_STEP_CLASS,
      START_STEP_CLASS,
      END_STEP_CLASS,
      ERROR_STEP_CLASS,
      PIPELINE_CLASS
    ], options.runtimeModule))
  }

  statements.push(generateNewInstance(PIPELINE_VAR, PIPELINE_CLASS));

  if (Array.isArray(input.steps)) {
    statements.push.apply(statements, generateSteps(input.steps, scope));
  }

  statements.push(generateModuleExport(PIPELINE_VAR));

  const program = t.program(statements);
  const ast = t.file(program);
  return ast;
}

function generateRequire(varName, moduleName) {
  return t.variableDeclaration("const",
    [
      t.variableDeclarator(
        Array.isArray(varName) ? t.objectPattern(varName.map(n => t.objectProperty(
          t.identifier(n),
          t.identifier(n), false, true
        ))) : t.identifier(varName),
        t.callExpression(
          t.identifier("require"),
          [t.stringLiteral(moduleName)]
        )
      )
    ]
  )
}

function generateNewInstance(varName, className, args = []) {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(varName),
      t.newExpression(
        t.identifier(className),
        args
      )
    )
  ]);
}

function generateModuleExport(varName) {
  return t.expressionStatement(
    t.assignmentExpression("=",
      t.memberExpression(
        t.identifier("module"),
        t.identifier("exports")
      ),
      t.identifier(varName)
    )
  )
}

function generateValue(value, isSubstitutions = false, scope = null) {
  switch (kindOf(value)) {
    case "undefined":
      return t.identifier("undefined");
    case "null":
      return t.nullLiteral();
    case "boolean":
      return t.booleanLiteral(value);
    case "number":
      return t.numericLiteral(value);
    case "string":
      if (isSubstitutions) {
        if (!scope) {
          throw new Error("if isSubstitutions true scope is required");
        }
        return resolveStringSubstitutions(value, scope)
      }
      return t.stringLiteral(value);
    case "object":
      return t.objectExpression(
        Object.keys(value).map(key => generateObjProperty(key, value[key]))
      );
    case "array":
      return t.arrayExpression(value.map(val => generateValue(val, isSubstitutions, scope)));
    default:
      throw new Error(`unsupported value type: ${kindOf(value)}`)
  }
}

function resolveStringSubstitutions(value, scope) {
  const requireSubstitution = "$require:";
  if (value.indexOf(requireSubstitution) === 0) {
    return t.callExpression(
      t.identifier("require"),
      [t.stringLiteral(
        getModulePath(
          value.substr(requireSubstitution.length),
          scope
        )
      )]
    )
  } else {
    return t.stringLiteral(value);
  }
}

function generateObjProperty(propName, propValue, isSubstitutions = false, scope = null) {
  return t.objectProperty(t.identifier(propName), generateValue(propValue, isSubstitutions, scope));
}

function generateUniqueName(prefix, scope) {
  return `${prefix}_${scope.uniqueCounter++}`;
}

function generateSteps(steps, scope) {
  const statements = [];
  statements.push.apply(statements, generateNewInstancesOfSteps(steps, scope));

  if (statements.length > 0) {
    statements.push.apply(statements, generateStepConnections(steps, scope));
    statements.push.apply(statements, generateCompositeSteps(steps, scope));
    statements.push(generateAddStepsToPipeline(steps, scope));
  }
  return statements;
}

function generateNewInstancesOfSteps(steps, scope) {
  return steps.map(step => generateNewInstanceOfStep(step, scope));
}

function generateNewInstanceOfStep(step, scope) {
  if (!STEP_CLASS_BY_TYPE[step.type]) {
    throw new Error(`unknown step type: ${step.type}`);
  }

  const uVar = generateUniqueName(`${step.type}Step`, scope);
  addStepVar(step.id, uVar, scope);

  const opts = generateStepOptions(step, scope);
  return generateNewInstance(uVar, STEP_CLASS_BY_TYPE[step.type], opts ? [opts] : []);
}

function addStepVar(stepId, varName, scope) {
  if (scope.stepVars[stepId]) {
    throw new Error(`duplicate step identifiers: ${stepId}`);
  }
  scope.stepVars[stepId] = varName;
}

function generateStepOptions(step, scope) {
  const props = [];

  if ("id" in step) {
    props.push(generateObjProperty("id", step.id));
  }

  if ("name" in step) {
    props.push(generateObjProperty("name", step.name));
  }

  if ("handler" in step) {
    if (kindOf(step.handler) === "string") {
      addDepModule(REQUIRE_FROM_STRING_MODULE, scope);

      props.push(t.objectProperty(
        t.identifier("handler"),
        t.callExpression(
          t.identifier(REQUIRE_FROM_STRING_VAR),
          [t.stringLiteral(step.handler)]
        )
      ))
    } else {
      props.push(generateObjProperty("handler", step.handler));
    }
  } else if ("handlerFile" in step) {
    if (kindOf(step.handlerFile) === "string") {
      props.push(t.objectProperty(
        t.identifier("handler"),
        t.callExpression(
          t.identifier("require"),
          [t.stringLiteral(getModulePath(step.handlerFile, scope))]
        )
      ))
    } else {
      props.push(generateObjProperty("handler", step.handlerFile));
    }
  }

  if ("ports" in step) {
    props.push(t.objectProperty(
      t.identifier("ports"),
      generateStepPortsOption(step.ports)
    ));
  }

  if ("props" in step) {
    props.push(t.objectProperty(
      t.identifier("props"),
      generateStepPropsOption(step.props, scope)
    ));
  }

  if (props.length === 0) {
    return null;
  }

  return t.objectExpression(props);
}

function generateStepPortsOption(ports) {
  if (kindOf(ports) === "object") {
    const objProps = [];

    if ("in" in ports) {
      objProps.push(generateObjProperty("in", ports.in));
    }

    if ("out" in ports) {
      objProps.push(generateObjProperty("out", ports.out));
    }

    return t.objectExpression(objProps);
  } else {
    return generateValue(ports);
  }
}

function generateStepPropsOption(props, scope) {
  if (kindOf(props) === "object") {
    return t.objectExpression(
      Object.keys(props).map(key => generateObjProperty(key, props[key], true, scope))
    );
  } else {
    return generateValue(props);
  }
}

function generateStepConnections(steps, scope) {
  const statements = []
  steps.forEach(step => {
    if (Array.isArray(step.connect)) {
      step.connect.forEach(connection => {
        statements.push(generateStepConnection(step.id, connection, scope))
      });
    }
  });
  return statements;
}

function generateStepConnection(stepId, connection, scope) {
  if (kindOf(connection) !== "object") {
    throw new TypeError("connection expected as object")
  }
  if (!scope.stepVars[stepId]) {
    throw new Error(`step not found with id: ${stepId}`)
  }
  if (!scope.stepVars[connection.stepId]) {
    throw new Error(`step not found with id: ${connection.stepId}`)
  }

  const portArgs = [];

  if ("srcOutPort" in connection) {
    portArgs.push(generateValue(connection.srcOutPort));
  }
  if ("dstInPort" in connection) {
    portArgs.push(generateValue(connection.dstInPort));
  }

  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier(scope.stepVars[stepId]),
        t.identifier("connectTo")
      ),
      [
        t.identifier(scope.stepVars[connection.stepId]),
        ...portArgs
      ]
    )
  );
}

function generateAddStepsToPipeline(steps, scope) {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier(PIPELINE_VAR),
        t.identifier("add")
      ),
      steps
        .filter(step => scope.stepVars[step.id])
        .map(step => t.identifier(scope.stepVars[step.id]))
    )
  );
}

function generateCompositeSteps(steps, scope) {
  const compositeSteps = steps.filter(step => step.type === "composite");

  if (compositeSteps.length === 0) {
    return [];
  }

  const statements = [];

  compositeSteps.forEach(compositeStep => {
    if (Array.isArray(compositeStep.steps)) {
      statements.push.apply(
        statements,
        generateCompositeSubSteps(compositeStep, compositeStep.steps, scope)
      );
    }
  });

  return statements;
}

function generateCompositeSubSteps(compositeStep, substeps, scope) {
  const compositeScope = {
    parentScope: scope,
    uniqueCounter: scope.uniqueCounter,
    stepVars: {},
    global: scope.global,
    dep: scope.dep
  };

  const statements = [];
  statements.push.apply(statements, generateNewInstancesOfSteps(substeps, compositeScope));

  if (statements.length > 0) {
    statements.push.apply(statements, generateStepConnections(substeps, compositeScope));
    statements.push.apply(statements, generateSetCompositeParameters(compositeStep, compositeScope));
    statements.push(generateAddStepsToComposite(compositeStep, substeps, compositeScope));
    statements.push.apply(statements, generateCompositeSteps(substeps, compositeScope));
  }

  scope.uniqueCounter = compositeScope.uniqueCounter;
  return statements;
}

function generateAddStepsToComposite(compositeStep, substeps, scope) {
  if (!scope.parentScope.stepVars[compositeStep.id]) {
    throw new Error(`composite step id doesn't exists: ${compositeStep.id}`)
  }

  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier(scope.parentScope.stepVars[compositeStep.id]),
        t.identifier("add")
      ),
      substeps
        .filter(substep => scope.stepVars[substep.id])
        .map(substep => t.identifier(scope.stepVars[substep.id]))
    )
  );
}

function generateSetCompositeParameters(compositeStep, scope) {
  if (!scope.parentScope.stepVars[compositeStep.id]) {
    throw new Error(`composite step id doesn't exists: ${compositeStep.id}`)
  }
  if (!scope.stepVars[compositeStep.startId]) {
    throw new Error(`start id doesn't exists for composite: ${compositeStep.startId}`)
  }
  if (!scope.stepVars[compositeStep.endId]) {
    throw new Error(`end id doesn't exists for composite: ${compositeStep.endId}`)
  }

  const statements = [];

  statements.push(t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier(scope.parentScope.stepVars[compositeStep.id]),
        t.identifier("setStartStep")
      ),
      [t.identifier(scope.stepVars[compositeStep.startId])]
    )
  ));

  statements.push(t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier(scope.parentScope.stepVars[compositeStep.id]),
        t.identifier("setEndStep")
      ),
      [t.identifier(scope.stepVars[compositeStep.endId])]
    )
  ));

  return statements;
}

function addDepModule(moduleName, scope) {
  if (scope.dep[moduleName]) return;

  if (moduleName === REQUIRE_FROM_STRING_MODULE) {
    scope.global.unshift(generateRequire(
      REQUIRE_FROM_STRING_VAR,
      REQUIRE_FROM_STRING_MODULE
    ));
  }

  scope.dep[moduleName] = true;
}

function getModulePath(moduleName, scope) {
  if (scope.baseDir === undefined || scope.baseDir === null) {
    return moduleName;
  }
  if (kindOf(scope.baseDir) !== "string") {
    throw new Error("baseDir option must be a string");
  }
  const baseDir = scope.baseDir ? `${scope.baseDir}${path.sep}` : "";
  const moudlePath = `${baseDir}${moduleName}`;
  return moudlePath;
}

module.exports = generateAst;
