const Step = require("./step");

class EndStep extends Step {
  constructor(options = {}) {
    super(options);
    this.type = "end";
  }
}

module.exports = EndStep;
