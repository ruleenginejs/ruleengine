class StepExecutorError extends Error {
  constructor(message, cause = null, inner = null) {
    super(message);
    this.cause = cause;
    this.inner = inner;
    this.name = "StepExecutorError";
  }
}

module.exports = {
  StepExecutorError
}
