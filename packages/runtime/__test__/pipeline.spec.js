const {
  SingleStep,
  CompositeStep,
  StartStep,
  EndStep,
  ErrorStep,
  Step,
  Pipeline,
  StepExecutorError
} = require("..");

describe("pipeline", () => {
  it("empty constructor", () => {
    const pipe = new Pipeline();

    expect(Object.keys(pipe.steps).length).toBe(0);
  });

  it("add step", () => {
    const pipe = new Pipeline();
    const step1 = new Step();
    const step2 = new Step();

    pipe.add(step1, step2);

    expect(pipe.steps[step1.id]).toBe(step1);
    expect(pipe.steps[step2.id]).toBe(step2);
  });

  it("add bad step", () => {
    const pipe = new Pipeline();
    const step = { id: 1 };

    expect(() => { pipe.add(step); }).toThrowError(/instance of children/);
  });

  it("remove step", () => {
    const pipe = new Pipeline();
    const step = new Step();

    pipe.add(step);
    expect(pipe.steps[step.id]).toBe(step);

    pipe.remove(step);
    expect(pipe.steps[step.id]).toBeUndefined();
  });

  it("remove step by id", () => {
    const pipe = new Pipeline();
    const step = new Step();

    pipe.add(step);
    expect(pipe.steps[step.id]).toBe(step);

    pipe.remove(step.id);
    expect(pipe.steps[step.id]).toBeUndefined();
  });

  it("get step by id", () => {
    const pipe = new Pipeline();
    const step = new Step();

    pipe.add(step);
    expect(pipe.getStep(step.id)).toBe(step);
  });

  it("add and get start step", () => {
    const pipe = new Pipeline();
    const step = new StartStep();

    pipe.add(step);
    expect(pipe.startStep).toBe(step);
  });

  it("add and get error step", () => {
    const pipe = new Pipeline();
    const step = new ErrorStep();

    pipe.add(step);
    expect(pipe.errorStep).toBe(step);
  });

  it('bad execute with bad context object', async () => {
    const pipe = new Pipeline();
    await expect(pipe.execute(null)).rejects.toThrowError(/must be object/)
  })

  it('bad execute without start step', async () => {
    const pipe = new Pipeline();
    await expect(pipe.execute()).rejects.toThrow(StepExecutorError)
  })

  it('execute with start and end steps', async () => {
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    start.connectTo(end);
    pipe.add(start, end);
    await expect(pipe.execute()).resolves.toBeDefined();
  })

  it('execute with start and end steps with context', async () => {
    const pipe = new Pipeline();
    const start = new StartStep();
    const end = new EndStep();
    start.connectTo(end);
    pipe.add(start, end);
    const context = { data: "some data" };
    await expect(pipe.execute(context)).resolves.toEqual(context);
  })

  it('do not call the handler for start and end steps', async () => {
    const startHandler = jest.fn();
    const endHandler = jest.fn();

    const pipe = new Pipeline();
    const start = new StartStep({ handler: startHandler });
    const end = new EndStep({ handler: endHandler });
    start.connectTo(end);
    pipe.add(start, end);

    await pipe.execute();

    expect(startHandler.mock.calls.length).toBe(0);
    expect(endHandler.mock.calls.length).toBe(0);
  })

  it('should bad execute when last step not end step', async () => {
    const pipe = new Pipeline();
    const start = new StartStep();
    const step = new Step();

    start.connectTo(step);
    pipe.add(start, step);

    await expect(() => pipe.execute()).rejects.toThrow(StepExecutorError);
  })

  it('bad execute if connect to unknown step', async () => {
    const unknownStepId = 99999;

    const pipe = new Pipeline();
    const startStep = new StartStep();
    startStep.connectTo(unknownStepId);
    pipe.add(startStep);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);
  })

  it('bad execute if connect to disabled port', async () => {
    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({ ports: { in: ["port1"] } });
    singleStep.enableInPort("port1", false);

    startStep.connectTo(singleStep, null, "port1");
    pipe.add(startStep, singleStep);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);
  })

  it('bad execute if disabled out port', async () => {
    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep();
    singleStep.enableOutPort("default", false);

    startStep.connectTo(singleStep);
    pipe.add(startStep, singleStep);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);
  })

  it('do not call the handler at the end step', async () => {
    const mockHandler = jest.fn();

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({ ports: { in: ["port1"] } });
    const endStep = new EndStep({ handler: mockHandler });

    startStep.connectTo(singleStep, null, "port1");
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    await pipe.execute();

    expect(mockHandler.mock.calls.length).toBe(0);
  })

  it('call handler with two args', async () => {
    const mockHandler = jest.fn((context, next) => {
      context.count++;
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({ handler: mockHandler });
    const endStep = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    const context = { count: 1 };
    const result = await pipe.execute(context);

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(result).toEqual({ count: 2 });
  })

  it('call handler with three args', async () => {
    const mockHandler = jest.fn((context, port, next) => {
      context.count++;
      context.port = port;
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({ handler: mockHandler });
    const endStep = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    const context = { count: 1 };
    const result = await pipe.execute(context);

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(result).toEqual({ count: 2, port: "default" });
  })

  it('call handler with four args', async () => {
    const customProps = {
      "prop1": 1,
      "prop2": false
    };

    const mockHandler = jest.fn((context, port, props, next) => {
      context.count++;
      context.port = port;
      context.props = props;
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({
      handler: mockHandler,
      props: customProps
    });
    const endStep = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    const context = { count: 1 };
    const result = await pipe.execute(context);

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(result).toEqual({
      count: 2,
      port: "default",
      props: customProps
    });
  })

  it('call handler with five args', async () => {
    const mockHandler = jest.fn((err, context, port, props, next) => {
      context.count++;
      context.port = port;
      context.err = err;
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({ handler: mockHandler });
    const endStep = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    const context = { count: 1 };
    const result = await pipe.execute(context);

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(result).toEqual({
      count: 2,
      port: "default",
      err: null
    });
  })

  it('no call handler if greater five args', async () => {
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((err, context, port, next, arg1, arg2) => {
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const singleStep = new SingleStep({ handler: mockHandler });
    const endStep = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    await pipe.execute();

    expect(mockHandler.mock.calls.length).toBe(0);
  })

  it('pipeline with ports', async () => {
    const mockHandler1 = jest.fn((context, port, next) => {
      context.count++;
      context.ports.push(port)
      next("p2");
    });
    const mockHandler2 = jest.fn((context, port, next) => {
      context.count++;
      context.ports.push(port)
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep1 = new SingleStep({
      handler: mockHandler1,
      ports: {
        out: ["p1", "p2"]
      }
    });
    const singleStep2 = new SingleStep({
      handler: mockHandler2,
      ports: {
        in: ["p3", "p4"]
      }
    });

    startStep.connectTo(singleStep1);
    singleStep1.connectTo(singleStep2, null, "p3");
    singleStep1.connectTo(singleStep2, "p1", "p3");
    singleStep1.connectTo(singleStep2, "p2", "p3");
    singleStep2.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep1, singleStep2);

    const context = { count: 1, ports: [] };
    const result = await pipe.execute(context);

    expect(mockHandler1.mock.calls.length).toBe(1);
    expect(mockHandler2.mock.calls.length).toBe(1);

    const expected = {
      count: 3,
      ports: ["default", "p3"]
    };
    expect(result).toEqual(expected);
    expect(context).toEqual(expected);
  })

  it('pipeline with throw error without error step', async () => {
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((context, next) => {
      throw new Error("handler error");
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep = new SingleStep({
      handler: mockHandler
    });

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);
    expect(mockHandler.mock.calls.length).toBe(1);
  })

  it('call next with error', async () => {
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((context, next) => {
      next(new Error("handler error"));
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep = new SingleStep({
      handler: mockHandler
    });

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);
    expect(mockHandler.mock.calls.length).toBe(1);
  })

  it('pipeline with error step', async () => {
    const errMsg = "handler error";
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((context, next) => {
      next(new Error(errMsg));
    });
    const mockLogHandler = jest.fn((err, context, port, props, next) => {
      context.count++;
      context.err = err;
      context.port = port;
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep = new SingleStep({
      handler: mockHandler
    });
    const errorStep = new ErrorStep();
    const logStep = new SingleStep({ handler: mockLogHandler });
    const endStep2 = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    errorStep.connectTo(logStep);
    logStep.connectTo(endStep2);

    pipe.add(startStep, endStep, singleStep)
      .add(errorStep, logStep, endStep2);

    const context = { count: 1 }
    const result = await pipe.execute(context);

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(mockLogHandler.mock.calls.length).toBe(1);

    expect(result.count).toBe(2);
    expect(result.port).toBe("default");
    expect(result.err.message).toBe(errMsg);
  })

  it('no execute handler for error step', async () => {
    const errMsg = "some error";
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((context, next) => {
      next(new Error(errMsg));
    });
    // eslint-disable-next-line no-unused-vars
    const mockErrorHandler = jest.fn((context, next) => {
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep = new SingleStep({ handler: mockHandler });
    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    const errorStep = new ErrorStep({ handler: mockErrorHandler });
    const endStep2 = new EndStep();
    errorStep.connectTo(endStep2);

    pipe.add(startStep, endStep, singleStep)
      .add(errorStep, endStep2);

    await pipe.execute();

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(mockErrorHandler.mock.calls.length).toBe(0);
  })

  it('throw error in error step', async () => {
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((context, next) => {
      throw new Error("handler error")
    });
    // eslint-disable-next-line no-unused-vars
    const mockLogHandler = jest.fn((err, context, port, next) => {
      throw new Error("throw error step");
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep = new SingleStep({ handler: mockHandler });

    const errorStep = new ErrorStep();
    const logStep = new SingleStep({ handler: mockLogHandler });
    const endStep2 = new EndStep();

    startStep.connectTo(singleStep);
    singleStep.connectTo(endStep);

    errorStep.connectTo(logStep);
    logStep.connectTo(endStep2);

    pipe.add(startStep, endStep, singleStep)
      .add(errorStep, logStep, endStep2);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);

    expect(mockHandler.mock.calls.length).toBe(1);
    expect(mockLogHandler.mock.calls.length).toBe(1);
  })

  it("redirect to error port on throw error", async () => {
    const errMsg = "handler error";

    // eslint-disable-next-line no-unused-vars
    const mockHandler1 = jest.fn((context, next) => {
      context.count++;
      throw new Error(errMsg);
    });
    const mockHandler2 = jest.fn((err, context, port, props, next) => {
      context.count++;
      context.port = port;
      context.err = err;
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();
    const singleStep1 = new SingleStep({
      handler: mockHandler1,
      ports: { out: ["port1", "error"] }
    });
    const singleStep2 = new SingleStep({
      handler: mockHandler2,
      ports: { in: ["port3"] }
    });

    startStep.connectTo(singleStep1);
    singleStep1.connectTo(singleStep2, "error", "port3");
    singleStep2.connectTo(endStep);

    pipe.add(startStep, endStep, singleStep1, singleStep2);

    const context = { count: 1 }
    const result = await pipe.execute(context);

    expect(mockHandler1.mock.calls.length).toBe(1);
    expect(mockHandler2.mock.calls.length).toBe(1);

    expect(result.count).toBe(3);
    expect(result.port).toBe("port3");
    expect(result.err.message).toBe(errMsg);
  })

  it("pipeline with composite step", async () => {
    // eslint-disable-next-line no-unused-vars
    const mockCompositeHandler = jest.fn();
    const mockHandler1 = jest.fn((context, port, next) => {
      context.count++;
      context.ports.push(port);
      next("p2");
    });
    const mockHandler2 = jest.fn((context, port, next) => {
      context.count++;
      context.ports.push(port);
      next("p4");
    });
    const mockHandler3 = jest.fn((context, port, next) => {
      context.count++;
      context.ports.push(port);
      next("p6");
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();

    const compositeStep = new CompositeStep({
      handler: mockCompositeHandler,
    });
    const singleStep1 = new SingleStep({
      handler: mockHandler1,
      ports: { in: ["p1"], out: ["p2"] }
    });
    const singleStep2 = new SingleStep({
      handler: mockHandler2,
      ports: { in: ["p3"], out: ["p4"] }
    });
    singleStep1.connectTo(singleStep2, "p2", "p3");
    compositeStep.setStartStep(singleStep1).setEndStep(singleStep2);

    const singleStep3 = new SingleStep({
      handler: mockHandler3,
      ports: { in: ["p5"], out: ["p6"] }
    });

    startStep.connectTo(compositeStep, null, "p1");
    compositeStep.connectTo(singleStep3, "p4", "p5");
    singleStep3.connectTo(endStep, "p6", null);

    pipe.add(startStep, endStep, compositeStep, singleStep3);

    const context = { count: 1, ports: [] }
    const result = await pipe.execute(context);

    expect(mockCompositeHandler.mock.calls.length).toBe(0);
    expect(mockHandler1.mock.calls.length).toBe(1);
    expect(mockHandler2.mock.calls.length).toBe(1);
    expect(mockHandler3.mock.calls.length).toBe(1);

    expect(result.count).toBe(4);
    expect(result.ports).toEqual(["p1", "p3", "p5"]);
  })

  it('throw error if last execution step is not the end step of the composite', async () => {
    // eslint-disable-next-line no-unused-vars
    const mockHandler = jest.fn((context, port, next) => {
      next();
    });

    const pipe = new Pipeline();
    const startStep = new StartStep();
    const endStep = new EndStep();

    const compositeStep = new CompositeStep();
    const singleStep1 = new SingleStep({ handler: mockHandler });
    const singleStep2 = new SingleStep();
    compositeStep.setStartStep(singleStep1)
      .setEndStep(singleStep2);

    startStep.connectTo(compositeStep);
    compositeStep.connectTo(endStep);

    pipe.add(startStep, endStep, compositeStep);

    await expect(pipe.execute()).rejects.toThrow(StepExecutorError);

    expect(mockHandler.mock.calls.length).toBe(1);
  })
});
