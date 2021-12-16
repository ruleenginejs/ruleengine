const EventEmmiter = require("events");
const Step = require("./step");
const StepExecutor = require("./executor");

const EXECUTE_START = "execute_start";
const EXECUTE_ERROR = "execute_error";
const EXECUTE_END = "execute_end";

class Pipeline extends EventEmmiter {
  constructor(options = {}) {
    super();

    if (!options) {
      options = {};
    }

    if (options.stepExecutor) {
      this.stepExecutor = options.stepExecutor;
    } else {
      this.stepExecutor = StepExecutor;
    }

    this.steps = {};
    this.startStep = null;
    this.errorStep = null;
  }

  add(...steps) {
    for (const step of steps) {
      if (!(step instanceof Step)) {
        throw new TypeError(
          "step must be instance of children class parent of Step");
      }
      if (step.type === "start") {
        this.startStep = step;
      } else if (step.type === "error") {
        this.errorStep = step;
      }
      this.steps[step.id] = step;
    }
    return this;
  }

  remove(stepOrId) {
    if (stepOrId instanceof Step) {
      delete this.steps[stepOrId.id];
    } else {
      delete this.steps[stepOrId];
    }
    return this;
  }

  getStep(stepId) {
    if (stepId in this.steps) {
      return this.steps[stepId];
    } else {
      return null;
    }
  }

  async execute(context = {}) {
    const executor = new this.stepExecutor(this.startStep, this.errorStep, this.steps);

    try {
      this.emit(EXECUTE_START, executor);
      return await executor.start(context);
    } catch (e) {
      this.emit(EXECUTE_ERROR, executor, e);
      throw e;
    } finally {
      this.emit(EXECUTE_END, executor);
    }
  }
}

module.exports = Pipeline;
