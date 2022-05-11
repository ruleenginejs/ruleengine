const EventEmmiter = require('events');
const { StepExecutorError } = require('./errors');

const STEP_BEGIN = 'step_begin';
const STEP_END = 'step_end';
const STEP_ERROR = 'step_error';

class StepExecutor extends EventEmmiter {
  constructor(startStep, errorStep, steps) {
    super();

    this.startStep = startStep;
    this.errorStep = errorStep;
    this.steps = steps;
  }

  async start(context) {
    if (!(typeof context === 'object' && context !== null)) {
      throw new TypeError('context arg must be object');
    }

    if (!this.startStep) {
      return this._handleError(context, new Error("start step doesn't exists"));
    }

    try {
      return await this._beginStep(this.startStep, this.steps, context);
    } catch (e) {
      return this._handleError(context, e);
    }
  }

  async _handleError(context, error) {
    if (!this.errorStep) {
      throw new StepExecutorError('step execution error', error);
    }

    try {
      return await this._beginStep(this.errorStep, this.steps, context, error);
    } catch (e) {
      throw new StepExecutorError('step execution error', error, e);
    }
  }

  async _beginStep(startStep, steps, context, error = null) {
    const [nextStep, prevStep] = await this._handleSteps(
      startStep,
      'default',
      steps,
      context,
      error
    );

    if (prevStep && prevStep[0] && prevStep[0].type !== 'end') {
      throw Error(
        `no end step: step_id(${prevStep[0].id}), out_port(${
          nextStep ? nextStep[2] : null
        })`
      );
    }

    return context;
  }

  async _handleSteps(startStep, inPort, steps, context, error = null) {
    let nextStep = [startStep, inPort];
    let prevStep = null;

    while (nextStep && nextStep[0]) {
      prevStep = nextStep;

      try {
        this._emitStepBegin(nextStep[0], nextStep[1]);

        nextStep = await this._nextStep(nextStep, steps, context, error);
      } catch (e) {
        this._emitStepError(nextStep[0], e);

        nextStep = this._handleErrorStep(nextStep[0], 'error', steps, e);
        error = e;
      } finally {
        this._emitStepEnd(prevStep[0], nextStep ? nextStep[2] : 'default');
      }
    }

    return [nextStep, prevStep];
  }

  async _nextStep([step, inPort], steps, context, error) {
    if (step.type === 'start' || step.type === 'error') {
      return this._getNextStep(step, steps, 'default');
    }

    if (step.type === 'end') {
      return null;
    }

    if (!step.inPortEnabled(inPort)) {
      throw new Error(
        `in port is disabled: step_id(${step.id}), in_port(${inPort})`
      );
    }

    let srcOutPort;

    if (step.type === 'composite') {
      srcOutPort = await this._handleComposite(step, inPort, context, error);
    } else {
      srcOutPort = await this._handleStep(step, inPort, context, error);
    }

    if (!srcOutPort) {
      srcOutPort = 'default';
    }

    if (!step.outPortEnabled(srcOutPort)) {
      throw new Error(
        `out port is disabled: step_id(${step.id}), out_port(${srcOutPort})`
      );
    }

    return this._getNextStep(step, steps, srcOutPort);
  }

  _getNextStep(step, steps, srcOutPort) {
    const connection = step.getConnection(srcOutPort);

    if (!connection) {
      return [null, null, srcOutPort];
    }

    const nextStep = steps[connection.stepId];

    if (!nextStep) {
      throw new Error(`step doesn't exists: step_id(${connection.stepId})`);
    }

    return [nextStep, connection.dstInPort, connection.srcOutPort];
  }

  _handleErrorStep(step, errorOutPort, steps, err) {
    if (!step.hasOutPort(errorOutPort)) {
      throw err;
    }

    const errorConnection = step.getConnection(errorOutPort);

    if (!errorConnection) {
      throw err;
    }

    return this._getNextStep(step, steps, errorOutPort);
  }

  async _handleComposite(step, inPort, context, error) {
    if (!step.startStep) {
      throw new Error(`composite step has no start step: step_id(${step.id})`);
    }

    if (!step.endStep) {
      throw new Error(`composite step has no end step: step_id(${step.id})`);
    }

    return this._beginCompositeStep(
      step.startStep,
      step.endStep,
      step.steps,
      inPort,
      context,
      error
    );
  }

  async _beginCompositeStep(
    startStep,
    endStep,
    steps,
    inPort,
    context,
    error = null
  ) {
    const [nextStep, prevStep] = await this._handleSteps(
      startStep,
      inPort,
      steps,
      context,
      error
    );

    if (prevStep && prevStep[0] !== endStep) {
      throw Error('last step is not the end step of the composite');
    }

    return nextStep ? nextStep[2] : null;
  }

  async _handleStep(step, inPort, context, error) {
    if (!step.handler) {
      return null;
    }

    const argc = step.handler.length;

    if (argc === 2) {
      return this._callHandler(step.handler, [context]);
    } else if (argc === 3) {
      return this._callHandler(step.handler, [context, inPort]);
    } else if (argc === 4) {
      return this._callHandler(step.handler, [context, inPort, step.props]);
    } else if (argc === 5) {
      return this._callHandler(step.handler, [
        error,
        context,
        inPort,
        step.props
      ]);
    } else {
      return null;
    }
  }

  _callHandler(handler, args) {
    return new Promise((resolve, reject) => {
      const next = (portOrError = null) => {
        if (portOrError instanceof Error) {
          reject(portOrError);
        } else if (typeof portOrError === 'string') {
          resolve(portOrError);
        } else {
          resolve(null);
        }
      };
      handler.apply(null, args.concat(next));
    });
  }

  _emitStepBegin(step, inPort) {
    this.emit(STEP_BEGIN, step, inPort);
  }

  _emitStepEnd(step, outPort) {
    this.emit(STEP_END, step, outPort);
  }

  _emitStepError(step, err) {
    this.emit(STEP_ERROR, step, err);
  }
}

module.exports = StepExecutor;
