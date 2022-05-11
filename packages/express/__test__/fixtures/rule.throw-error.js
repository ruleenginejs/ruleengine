const {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep
} = require('@ruleenginejs/runtime');

const pipeline = new Pipeline();
const start = new StartStep();
const end = new EndStep();
const step = new SingleStep({
  // eslint-disable-next-line no-unused-vars
  handler: (context, next) => {
    throw new Error('Some error in step');
  }
});

start.connectTo(step);
step.connectTo(end);

pipeline.add(start, end, step);

module.exports = pipeline;
