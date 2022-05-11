const Step = require('./step');

class StartStep extends Step {
  constructor(options = {}) {
    super(options);
    this.type = 'start';
  }
}

module.exports = StartStep;
