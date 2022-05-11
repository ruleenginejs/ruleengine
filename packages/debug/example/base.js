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
    next('p2');
  },
  ports: {
    in: ['p1'],
    out: ['p2']
  }
});
const end = new EndStep({ id: 3, name: 'end' });

start.connectTo(step, null, 'p1');
step.connectTo(end, 'p2', null);

pipe.add(start, step, end);

debug(pipe, 'base');
pipe.execute();
