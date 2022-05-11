const debug = require('..');
const {
  Pipeline,
  StartStep,
  EndStep,
  SingleStep,
  CompositeStep
} = require('@ruleenginejs/runtime');

const LOG_NS = 'ruleengine';

describe('ruleengine debug', () => {
  it('base log', async () => {
    const mockLog = jest.fn();

    const pipe = createPipeline();
    debug(LOG_NS, mockLog)(pipe, 'sample');
    await pipe.execute();

    expect(mockLog.mock.calls[0][0]).toBe(
      '[pipeline sample] start execute: all_steps(3)'
    );

    expect(mockLog.mock.calls[1][0]).toBe(
      '[pipeline sample] step begin: id(1), name(start), in_port(default), type(start), props({})'
    );
    expect(mockLog.mock.calls[2][0]).toBe(
      '[pipeline sample] step end:   id(1), name(start), out_port(default), type(start), props({})'
    );

    expect(mockLog.mock.calls[3][0]).toBe(
      '[pipeline sample] step begin: id(2), name(some step), in_port(p1), type(single), props({})'
    );
    expect(mockLog.mock.calls[4][0]).toBe(
      '[pipeline sample] step end:   id(2), name(some step), out_port(p2), type(single), props({})'
    );

    expect(mockLog.mock.calls[5][0]).toBe(
      '[pipeline sample] step begin: id(3), name(end), in_port(default), type(end), props({})'
    );
    expect(mockLog.mock.calls[6][0]).toBe(
      '[pipeline sample] step end:   id(3), name(end), out_port(default), type(end), props({})'
    );

    expect(mockLog.mock.calls[7][0]).toBe('[pipeline sample] end execute');
  });

  it('log with error step', async () => {
    const mockLog = jest.fn();

    const pipe = createPipelineWithErrorStep();
    debug(LOG_NS, mockLog)(pipe, 'sample');

    await expect(() => pipe.execute()).rejects.toThrow(Error);

    expect(mockLog.mock.calls[0][0]).toBe(
      '[pipeline sample] start execute: all_steps(3)'
    );

    expect(mockLog.mock.calls[1][0]).toBe(
      '[pipeline sample] step begin: id(1), name(start), in_port(default), type(start), props({})'
    );
    expect(mockLog.mock.calls[2][0]).toBe(
      '[pipeline sample] step end:   id(1), name(start), out_port(default), type(start), props({})'
    );

    expect(mockLog.mock.calls[3][0]).toBe(
      '[pipeline sample] step begin: id(2), name(some step), in_port(default), type(single), props({})'
    );
    expect(mockLog.mock.calls[4][0]).toMatch('[pipeline sample] step error');
    expect(mockLog.mock.calls[5][0]).toBe(
      '[pipeline sample] step end:   id(2), name(some step), out_port(default), type(single), props({})'
    );

    expect(mockLog.mock.calls[6][0]).toMatch('[pipeline sample] execute error');
    expect(mockLog.mock.calls[7][0]).toBe('[pipeline sample] end execute');
  });

  it('composite log', async () => {
    const mockLog = jest.fn();

    const pipe = createPipelineWithCompositeStep();
    debug(LOG_NS, mockLog)(pipe, 'sample');
    await pipe.execute();

    expect(mockLog.mock.calls[0][0]).toBe(
      '[pipeline sample] start execute: all_steps(3)'
    );

    expect(mockLog.mock.calls[1][0]).toBe(
      '[pipeline sample] step begin: id(1), name(start), in_port(default), type(start), props({})'
    );
    expect(mockLog.mock.calls[2][0]).toBe(
      '[pipeline sample] step end:   id(1), name(start), out_port(default), type(start), props({})'
    );

    expect(mockLog.mock.calls[3][0]).toBe(
      '[pipeline sample] step begin: id(2), name(composite step), in_port(default), type(composite), props({})'
    );

    expect(mockLog.mock.calls[4][0]).toBe(
      '[pipeline sample] step begin: id(2.1), in_port(default), type(single), props({})'
    );
    expect(mockLog.mock.calls[5][0]).toBe(
      '[pipeline sample] step end:   id(2.1), out_port(default), type(single), props({})'
    );

    expect(mockLog.mock.calls[6][0]).toBe(
      '[pipeline sample] step end:   id(2), name(composite step), out_port(default), type(composite), props({})'
    );

    expect(mockLog.mock.calls[7][0]).toBe(
      '[pipeline sample] step begin: id(3), name(end), in_port(default), type(end), props({})'
    );
    expect(mockLog.mock.calls[8][0]).toBe(
      '[pipeline sample] step end:   id(3), name(end), out_port(default), type(end), props({})'
    );

    expect(mockLog.mock.calls[9][0]).toBe('[pipeline sample] end execute');
  });

  it('destroy log', async () => {
    const mockLog = jest.fn();

    const pipe = createPipelineWithCompositeStep();
    const logger = debug(LOG_NS, mockLog)(pipe, 'sample');

    await pipe.execute();
    expect(mockLog.mock.calls.length).toBe(10);

    logger.destroy();
    await pipe.execute();

    expect(mockLog.mock.calls.length).toBe(10);
    expect(pipe.listenerCount('execution_start')).toBe(0);
    expect(pipe.listenerCount('execution_end')).toBe(0);
    expect(pipe.listenerCount('execution_error')).toBe(0);
  });

  it('log custom message', async () => {
    const mockLog = jest.fn();

    const pipe = createPipeline();
    const logger = debug(LOG_NS, mockLog)(pipe, 'sample');

    logger.log('custom message');

    expect(mockLog.mock.calls[0][0]).toBe('[pipeline sample] custom message');
  });

  it('no pipeline name', async () => {
    const mockLog = jest.fn();

    const pipe = createPipeline();
    debug(LOG_NS, mockLog)(pipe);
    await pipe.execute();

    expect(mockLog.mock.calls[0][0]).toBe(
      '[pipeline] start execute: all_steps(3)'
    );
    expect(mockLog.mock.calls[1][0]).toBe(
      '[pipeline] step begin: id(1), name(start), in_port(default), type(start), props({})'
    );
    expect(mockLog.mock.calls[2][0]).toBe(
      '[pipeline] step end:   id(1), name(start), out_port(default), type(start), props({})'
    );
  });
});

function createPipeline() {
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
  return pipe;
}

function createPipelineWithErrorStep() {
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
  return pipe;
}

function createPipelineWithCompositeStep() {
  const pipe = new Pipeline();
  const start = new StartStep({ id: 1, name: 'start' });
  const end = new EndStep({ id: 3, name: 'end' });

  const composite = new CompositeStep({ id: 2, name: 'composite step' });
  const subStep = new SingleStep({ id: '2.1' });
  composite.setStartStep(subStep).setEndStep(subStep);

  start.connectTo(composite);
  composite.connectTo(end);
  pipe.add(start, composite, end);
  return pipe;
}
