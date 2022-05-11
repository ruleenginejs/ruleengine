const {
  SingleStep,
  CompositeStep,
  StartStep,
  EndStep,
  ErrorStep,
  Step,
  Pipeline,
  StepExecutorError
} = require('..');

describe('pipeline events', () => {
  it('should emit execute_start event when execute start', async () => {
    const cb = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    start.connectTo(end);
    pipe.add(start, end);

    pipe.on('execute_start', cb);

    await pipe.execute();

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0] instanceof pipe.stepExecutor).toBe(true);
  });

  it('should emit execute_error event when execute error', async () => {
    const cb = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new Step({
      // eslint-disable-next-line no-unused-vars
      handler: (context, next) => {
        throw new Error('some error');
      }
    });
    start.connectTo(step);
    step.connectTo(end);
    pipe.add(start, end, step);

    pipe.on('execute_error', cb);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0] instanceof pipe.stepExecutor).toBe(true);
    expect(cb.mock.calls[0][1] instanceof Error).toBe(true);
  });

  it('should emit execute_end event when normal execute end', async () => {
    const cb = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    start.connectTo(end);
    pipe.add(start, end);

    pipe.on('execute_end', cb);

    await pipe.execute();

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0] instanceof pipe.stepExecutor).toBe(true);
  });

  it('should emit execute_end event when execute error', async () => {
    const cb = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new Step({
      // eslint-disable-next-line no-unused-vars
      handler: (context, next) => {
        throw new Error('some error');
      }
    });
    start.connectTo(step);
    step.connectTo(end);
    pipe.add(start, step, end);

    pipe.on('execute_end', cb);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0] instanceof pipe.stepExecutor).toBe(true);
  });

  it('should emit step_begin and step_end event when handle start step', async () => {
    const cbBegin = jest.fn();
    const cbEnd = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    start.connectTo(end);
    pipe.add(start, end);

    pipe.on('execute_start', executor => {
      executor.on('step_begin', cbBegin);
      executor.on('step_end', cbEnd);
    });

    await pipe.execute();

    expect(cbBegin.mock.calls.length).toBe(2);
    expect(cbBegin.mock.calls[0][0]).toBe(start);
    expect(cbBegin.mock.calls[0][1]).toBe('default');

    expect(cbEnd.mock.calls.length).toBe(2);
    expect(cbEnd.mock.calls[0][0]).toBe(start);
    expect(cbEnd.mock.calls[0][1]).toBe('default');
  });

  it('should emit step_begin and step_end event when handle end step', async () => {
    const cbBegin = jest.fn();
    const cbEnd = jest.fn();

    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    start.connectTo(end);
    pipe.add(start, end);

    pipe.on('execute_start', executor => {
      executor.on('step_begin', cbBegin);
      executor.on('step_end', cbEnd);
    });

    await pipe.execute();

    expect(cbBegin.mock.calls.length).toBe(2);
    expect(cbBegin.mock.calls[1][0]).toBe(end);
    expect(cbBegin.mock.calls[1][1]).toBe('default');

    expect(cbEnd.mock.calls.length).toBe(2);
    expect(cbEnd.mock.calls[1][0]).toBe(end);
    expect(cbEnd.mock.calls[1][1]).toBe('default');
  });

  it('should emit step_begin event when start handle single step', async () => {
    const cb = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new SingleStep({ ports: { in: ['p1'] } });
    start.connectTo(step, null, 'p1');
    step.connectTo(end);
    pipe.add(start, end, step);

    pipe.on('execute_start', executor => {
      executor.on('step_begin', cb);
    });

    await pipe.execute();

    expect(cb.mock.calls.length).toBe(3);
    expect(cb.mock.calls[1][0]).toBe(step);
    expect(cb.mock.calls[1][1]).toBe('p1');
  });

  it('should emit step_end event when end handle single step', async () => {
    const cb = jest.fn();
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new SingleStep({
      handler: (context, next) => {
        next('p1');
      },
      ports: { out: ['p1'] }
    });
    start.connectTo(step);
    step.connectTo(end, 'p1', null);
    pipe.add(start, end, step);

    pipe.on('execute_start', executor => {
      executor.on('step_end', cb);
    });

    await pipe.execute();

    expect(cb.mock.calls.length).toBe(3);
    expect(cb.mock.calls[1][0]).toBe(step);
    expect(cb.mock.calls[1][1]).toBe('p1');
  });

  it('should emit step_error event when error handle single step', async () => {
    const err = new Error('some error');
    const cb = jest.fn();

    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new SingleStep({
      handler: (context, next) => {
        next(err);
      }
    });
    start.connectTo(step);
    step.connectTo(end);
    pipe.add(start, end, step);

    pipe.on('execute_start', executor => {
      executor.on('step_error', cb);
    });

    await expect(() => pipe.execute()).rejects.toThrow(StepExecutorError);

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0]).toBe(step);
    expect(cb.mock.calls[0][1]).toBe(err);
  });

  it('should emit step_begin, step_error, step_end event when handle error step', async () => {
    const err = new Error('some error');
    const cbBegin = jest.fn();
    const cbError = jest.fn();
    const cbEnd = jest.fn();

    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new SingleStep({
      handler: (context, next) => {
        next(err);
      },
      ports: { out: ['error'] }
    });
    start.connectTo(step);
    step.connectTo(end);
    step.connectTo(end, 'error', null);
    pipe.add(start, end, step);

    pipe.on('execute_start', executor => {
      executor
        .on('step_begin', cbBegin)
        .on('step_error', cbError)
        .on('step_end', cbEnd);
    });

    await pipe.execute();

    expect(cbBegin.mock.calls.length).toBe(3);
    expect(cbBegin.mock.calls[1][0]).toBe(step);
    expect(cbBegin.mock.calls[1][1]).toBe('default');

    expect(cbError.mock.calls.length).toBe(1);
    expect(cbError.mock.calls[0][0]).toBe(step);
    expect(cbError.mock.calls[0][1]).toBe(err);

    expect(cbEnd.mock.calls.length).toBe(3);
    expect(cbEnd.mock.calls[1][0]).toBe(step);
    expect(cbEnd.mock.calls[1][1]).toBe('error');
  });

  it('should emit step_begin, step_end event for ErrorStep', async () => {
    const err = new Error('some error');
    const cbBegin = jest.fn();
    const cbEnd = jest.fn();

    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const step = new SingleStep({
      handler: (context, next) => {
        next(err);
      }
    });
    start.connectTo(step);
    step.connectTo(end);

    const error = new ErrorStep();
    error.connectTo(end);

    pipe.add(start, end, step, error);

    pipe.on('execute_start', executor => {
      executor.on('step_begin', cbBegin).on('step_end', cbEnd);
    });

    await pipe.execute();

    expect(cbBegin.mock.calls.length).toBe(4);
    expect(cbBegin.mock.calls[2][0]).toBe(error);
    expect(cbBegin.mock.calls[2][1]).toBe('default');

    expect(cbEnd.mock.calls.length).toBe(4);
    expect(cbEnd.mock.calls[2][0]).toBe(error);
    expect(cbEnd.mock.calls[2][1]).toBe('default');
  });

  it('should emit step_begin, step_end event when handle composite step', async () => {
    const cbBegin = jest.fn();
    const cbEnd = jest.fn();

    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    const composite = new CompositeStep();
    const step = new SingleStep();
    composite.setStartStep(step).setEndStep(step);

    start.connectTo(composite);
    composite.connectTo(end);

    pipe.add(start, end, composite);

    pipe.on('execute_start', executor => {
      executor.on('step_begin', cbBegin).on('step_end', cbEnd);
    });

    await pipe.execute();

    expect(cbBegin.mock.calls.length).toBe(4);
    expect(cbBegin.mock.calls[1][0]).toBe(composite);
    expect(cbBegin.mock.calls[1][1]).toBe('default');

    expect(cbEnd.mock.calls.length).toBe(4);
    expect(cbEnd.mock.calls[2][0]).toBe(composite);
    expect(cbEnd.mock.calls[2][1]).toBe('default');
  });
});
