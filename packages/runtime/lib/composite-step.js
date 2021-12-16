const Step = require("./step");

class CompositeStep extends Step {
  constructor(options = {}) {
    super(options);
    this.type = "composite";
    this.startStep = null;
    this.endStep = null;
    this.steps = {};
  }

  _checkStep(step) {
    if (!(step instanceof Step)) {
      throw new TypeError(
        "step must be instance of children class parent of Step");
    }
  }

  setStartStep(step) {
    this._checkStep(step);
    this.startStep = step;
    this.ports.in = step.ports.in;
    this.add(step);
    return this;
  }

  setEndStep(step) {
    this._checkStep(step);
    this.endStep = step;
    this.ports.out = step.ports.out;
    this.add(step);
    return this;
  }

  add(...steps) {
    for (const step of steps) {
      this._checkStep(step);
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
}

module.exports = CompositeStep;
