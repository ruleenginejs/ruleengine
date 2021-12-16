const Step = require("./step");

class SingleStep extends Step {
  constructor(options = {}) {
    super(options);
    this.type = "single";
  }
}

module.exports = SingleStep;
