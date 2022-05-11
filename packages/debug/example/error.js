const debug = require('..')('ruleengine');
const {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep
} = require('@ruleenginejs/runtime');

const pipe = new Pipeline();
const start = new StartStep({ id: 1, name: 'start' });
const step = new SingleStep({
  id: 2,
  name: 'some step',
  handler: (context, next) => {
    next(new Error('some step error'));
  }
});
const end = new EndStep({ id: 3, name: 'end' });

start.connectTo(step);
step.connectTo(end);

pipe.add(start, step, end);

debug(pipe, 'error');
// eslint-disable-next-line no-unused-vars
pipe.execute().catch(e => {});
