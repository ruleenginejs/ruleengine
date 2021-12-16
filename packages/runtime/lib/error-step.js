const Step = require("./step");

class ErrorStep extends Step {
  constructor(options = {}) {
    super(options);
    this.type = "error";
  }
}

module.exports = ErrorStep;
