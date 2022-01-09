const createError = require("http-errors");
const debug = require("@ruleenginejs/debug");
const kindOf = require("kind-of");

module.exports = ruleEngine;

function ruleEngine(rules, options) {
  const opts = options || {};

  if (kindOf(rules) !== "object" && typeof rules !== "function") {
    throw new TypeError("Rules argument must be an object or function");
  }

  let idParam;
  if (typeof opts.idParam === "string") {
    idParam = opts.idParam;
  } else {
    idParam = "id";
  }

  let isDebug;
  if (typeof opts.debug === "boolean") {
    isDebug = opts.debug;
  } else {
    isDebug = false;
  }

  let logger;
  if (typeof opts.logger === "function") {
    logger = opts.logger;
  } else {
    logger = null;
  }

  let debugNamespace;
  if (typeof opts.debugNamespace === "string") {
    debugNamespace = opts.debugNamespace;
  } else {
    debugNamespace = "ruleengine";
  }

  let context;
  if (typeof opts.context === "function") {
    context = opts.context;
  } else {
    context = (req, res) => ({ req, res, data: {} });
  }

  let rulesFn;
  if (typeof rules === "function") {
    rulesFn = rules;
  } else {
    rulesFn = null;
  }

  let debugFn;
  if (isDebug) {
    debugFn = debug(debugNamespace, logger);
  } else {
    debugFn = null;
  }

  return async function middleware(req, res, next) {
    const id = req.params[idParam];
    const rule = rulesFn ? rulesFn(req, res, id) : rules[id];

    if (!rule) {
      next(createError(404, `Rule '${id}' not found`));
      return;
    }

    const log = isDebug ? debugFn(rule, id) : null;

    try {
      await rule.execute(context(req, res));
    } catch (e) {
      next(createError(500, `Rule '${id}' execute error`, { cause: e }));
    } finally {
      if (log) {
        log.destroy();
      }
    }
  }
}
