const {
  SingleStep,
  CompositeStep,
  StartStep,
  EndStep,
  ErrorStep,
  Step
} = require('..');

describe('base step', () => {
  it('empty constructor', () => {
    const step = new Step();

    expect(step.id).not.toBeUndefined();
    expect(step.id).not.toBeNull();
    expect(step.name).toBeNull();
    expect(step.type).toBeNull();
    expect(step.handler).toBeNull();

    expect(step.ports).not.toBeUndefined();
    expect(step.ports).not.toBeNull();
    expect(step.ports.in).toEqual({ default: true });
    expect(step.ports.out).toEqual({ default: true });

    expect(Object.keys(step.props).length).toBe(0);
  });

  it('pass id to options', () => {
    const step1 = new Step({ id: 23456385 });
    const step2 = new Step({ id: 'step234' });

    expect(step1.id).toBe(23456385);
    expect(step2.id).toBe('step234');
  });

  it('pass bad id to options', () => {
    expect(() => {
      new Step({ id: false });
    }).toThrow(TypeError);
    expect(() => {
      new Step({ id: [] });
    }).toThrow(TypeError);
  });

  it('pass name to options', () => {
    const step = new Step({ name: 'Best step' });
    expect(step.name).toBe('Best step');
  });

  it('pass bad name to options', () => {
    expect(() => {
      new Step({ name: false });
    }).toThrow(TypeError);
    expect(() => {
      new Step({ name: [] });
    }).toThrow(TypeError);
    expect(() => {
      new Step({ name: 1 });
    }).toThrow(TypeError);
  });

  it('pass handler to options', () => {
    const fn = () => {};
    const step = new Step({ handler: fn });
    expect(step.handler).toBe(fn);
  });

  it('pass bad handler to options', () => {
    expect(() => {
      new Step({ handler: false });
    }).toThrow(TypeError);
    expect(() => {
      new Step({ handler: [] });
    }).toThrow(TypeError);
    expect(() => {
      new Step({ handler: 1 });
    }).toThrow(TypeError);
    expect(() => {
      new Step({ handler: 'h' });
    }).toThrow(TypeError);
  });

  it('pass ports to options', () => {
    const step = new Step({
      ports: {
        in: ['port1', 'port2'],
        out: ['port3', 'port4']
      }
    });
    expect(step.ports.in).toEqual({
      port1: true,
      port2: true,
      default: true
    });
    expect(step.ports.out).toEqual({
      port3: true,
      port4: true,
      default: true
    });
  });

  it('pass bad ports to options', () => {
    expect(() => {
      new Step({
        ports: {
          in: [1, false, null, []]
        }
      });
    }).toThrow(TypeError);
    expect(() => {
      new Step({
        ports: {
          out: [1, false, null, []]
        }
      });
    }).toThrow(TypeError);
  });

  it('pass props to options', () => {
    const props = {
      param1: true,
      param2: 'str',
      param3: [1, 3]
    };
    const step = new Step({ props });
    expect(step.props).toEqual(props);
  });

  it('disable port', () => {
    const step = new Step({
      ports: {
        in: ['port1', 'port2'],
        out: ['port3', 'port4']
      }
    });

    expect(step.inPortEnabled('port1')).toBe(true);
    expect(step.outPortEnabled('port3')).toBe(true);

    step.enableInPort('port1', false);
    step.enableOutPort('port3', false);

    expect(step.inPortEnabled('port1')).toBe(false);
    expect(step.outPortEnabled('port3')).toBe(false);
  });

  it('disable not exists port', () => {
    const step = new Step();

    expect(() => {
      step.enableInPort('port1', true);
    }).toThrowError(/port name/);
    expect(() => {
      step.enableOutPort('port2', false);
    }).toThrowError(/port name/);
    expect(() => {
      step.inPortEnabled('port1');
    }).toThrowError(/port name/);
    expect(() => {
      step.outPortEnabled('port2');
    }).toThrowError(/port name/);
  });

  it('step connect to step through default ports', () => {
    const step1 = new Step();
    const step2 = new Step();

    step1.connectTo(step2);

    expect(step1.connections).toEqual({
      default: {
        stepId: step2.id,
        srcOutPort: 'default',
        dstInPort: 'default'
      }
    });
  });

  it('step connect to step through specific ports', () => {
    const step1 = new Step({ ports: { in: ['port1'], out: ['port2'] } });
    const step2 = new Step({ ports: { in: ['port3'], out: ['port4'] } });

    step1.connectTo(step2, 'port2', 'port3');

    expect(step1.connections).toEqual({
      port2: {
        stepId: step2.id,
        srcOutPort: 'port2',
        dstInPort: 'port3'
      }
    });
  });

  it('step connect to step with id', () => {
    const step1 = new Step();
    const step2 = new Step({ ports: { in: ['port3'], out: ['port4'] } });

    step1.connectTo(step2.id, null, 'port3');

    expect(step1.connections).toEqual({
      default: {
        stepId: step2.id,
        srcOutPort: 'default',
        dstInPort: 'port3'
      }
    });
  });

  it('get connection for default ports', () => {
    const step1 = new Step();
    const step2 = new Step();

    step1.connectTo(step2);

    expect(step1.getConnection()).toEqual({
      stepId: step2.id,
      srcOutPort: 'default',
      dstInPort: 'default'
    });
  });

  it('get connection for specific ports', () => {
    const step1 = new Step({ ports: { in: ['port1'], out: ['port2'] } });
    const step2 = new Step({ ports: { in: ['port3'], out: ['port4'] } });

    step1.connectTo(step2, 'port2', 'port3');

    expect(step1.getConnection('port2')).toEqual({
      stepId: step2.id,
      srcOutPort: 'port2',
      dstInPort: 'port3'
    });
  });

  it('get null connection', () => {
    const step1 = new Step({
      ports: { in: ['port1'], out: ['port2', 'port3'] }
    });
    const step2 = new Step({ ports: { in: ['port4'], out: ['port5'] } });

    step1.connectTo(step2, 'port2', 'port4');
    step1.connectTo(step2, 'port2', null);

    expect(step1.getConnection('port3')).toBeNull();
  });

  it('replace connect', () => {
    const step1 = new Step({
      ports: { in: ['port1'], out: ['port2', 'port3'] }
    });
    const step2 = new Step({ ports: { in: ['port4'], out: ['port5'] } });

    step1.connectTo(step2, 'port2', 'port4');

    expect(step1.getConnection('port2')).toEqual({
      stepId: step2.id,
      srcOutPort: 'port2',
      dstInPort: 'port4'
    });

    step1.connectTo(step2, 'port2', null);

    expect(step1.getConnection('port2')).toEqual({
      stepId: step2.id,
      srcOutPort: 'port2',
      dstInPort: 'default'
    });
  });

  it('get connection with bad src port', () => {
    const step1 = new Step();
    const step2 = new Step();

    step1.connectTo(step2);

    expect(() => {
      step1.getConnection('port1');
    }).toThrowError(/doesn't exists/);
  });

  it('step connection to step with bad src port', () => {
    const step1 = new Step();
    const step2 = new Step();

    expect(() => {
      step1.connectTo(step2, 'port1');
    }).toThrowError(/doesn't exists/);
  });

  it('step connection to step with bad dst port', () => {
    const step1 = new Step();
    const step2 = new Step();

    expect(() => {
      step1.connectTo(step2, null, 'port2');
    }).toThrowError(/doesn't exists/);
  });

  it('unchecked dts port if connect with id', () => {
    const step1 = new Step();
    const step2 = new Step();

    expect(() => {
      step1.connectTo(step2.id, null, 'port2');
    }).not.toThrowError(/doesn't exists/);
  });
});

describe('signle step', () => {
  it('single step type', () => {
    const step = new SingleStep();
    expect(step.type).toBe('single');
  });

  it('Step parent SingleStep', () => {
    const step = new SingleStep();
    expect(step instanceof Step).toBe(true);
  });
});

describe('start step', () => {
  it('start step type', () => {
    const step = new StartStep();
    expect(step.type).toBe('start');
  });

  it('Step parent SingleStep', () => {
    const step = new StartStep();
    expect(step instanceof Step).toBe(true);
  });
});

describe('end step', () => {
  it('end step type', () => {
    const step = new EndStep();
    expect(step.type).toBe('end');
  });

  it('Step parent SingleStep', () => {
    const step = new EndStep();
    expect(step instanceof Step).toBe(true);
  });
});

describe('error step', () => {
  it('error step type', () => {
    const step = new ErrorStep();
    expect(step.type).toBe('error');
  });

  it('Step parent SingleStep', () => {
    const step = new ErrorStep();
    expect(step instanceof Step).toBe(true);
  });
});

describe('composite step', () => {
  it('empty constructor', () => {
    const step = new CompositeStep();
    expect(step.type).toBe('composite');
    expect(step.startStep).toBeNull();
    expect(step.endStep).toBeNull();
  });

  it('composite step type', () => {
    const step = new CompositeStep();
    expect(step.type).toBe('composite');
  });

  it('Step parent SingleStep', () => {
    const step = new CompositeStep();
    expect(step instanceof Step).toBe(true);
  });

  it('set start and end step', () => {
    const compositeStep = new CompositeStep();
    const step1 = new SingleStep();
    const step2 = new SingleStep();
    compositeStep.setStartStep(step1).setEndStep(step2);

    expect(compositeStep.startStep).toBe(step1);
    expect(compositeStep.endStep).toBe(step2);
    expect(compositeStep.getStep(step1.id)).toBe(step1);
    expect(compositeStep.getStep(step2.id)).toBe(step2);
  });

  it('add and remove step', () => {
    const compositeStep = new CompositeStep();
    const step1 = new SingleStep();
    const step2 = new SingleStep();
    compositeStep.add(step1, step2);

    expect(compositeStep.getStep(step1.id)).toBe(step1);
    expect(compositeStep.getStep(step2.id)).toBe(step2);

    compositeStep.remove(step1);

    expect(compositeStep.getStep(step1.id)).toBeNull();
    expect(compositeStep.getStep(step2.id)).toBe(step2);

    compositeStep.remove(step2.id);

    expect(compositeStep.getStep(step1.id)).toBeNull();
    expect(compositeStep.getStep(step2.id)).toBeNull();
  });

  it('forwarding in ports to start step', () => {
    const compositeStep = new CompositeStep();
    const step1 = new SingleStep({ ports: { in: ['p1', 'p2'] } });
    compositeStep.setStartStep(step1);

    expect(compositeStep.hasInPort('p1')).toBe(true);
    expect(compositeStep.hasInPort('p2')).toBe(true);
  });

  it('forwarding out ports to end step', () => {
    const compositeStep = new CompositeStep();
    const step1 = new SingleStep({ ports: { out: ['p1', 'p2'] } });
    compositeStep.setEndStep(step1);

    expect(compositeStep.hasOutPort('p1')).toBe(true);
    expect(compositeStep.hasOutPort('p2')).toBe(true);
  });
});
