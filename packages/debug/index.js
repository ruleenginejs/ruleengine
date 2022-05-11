const debug = require('debug');

const EXECUTE_START = 'execute_start';
const EXECUTE_END = 'execute_end';
const EXECUTE_ERROR = 'execute_error';

const STEP_BEGIN = 'step_begin';
const STEP_END = 'step_end';
const STEP_ERROR = 'step_error';

module.exports = createDebug;
module.exports.pipelineDebug = pipelineDebug;

function pipelineDebug(name, pipeline, log) {
  let _executor = null;

  _attach(pipeline);

  function _log(message) {
    if (name) {
      log(`[pipeline ${name}] ${message}`);
    } else {
      log(`[pipeline] ${message}`);
    }
  }

  function _logError(prefix, err) {
    let message = `${prefix}: ${err.name}(${err.message}), stack(${err.stack})`;

    if (err.cause) {
      message += `, cause: ${err.cause.name}(${err.cause.message}), stack(${err.cause.stack})`;
    }

    if (err.inner) {
      message += `, inner: ${err.inner.name}(${err.inner.message}), stack(${err.inner.stack})`;
    }

    _log(message);
  }

  function _logStep(prefix, step, inPort, outPort) {
    const _name = step.name ? `name(${step.name}), ` : '';
    const _inPort = inPort !== undefined ? `in_port(${inPort}), ` : '';
    const _outPort = outPort !== undefined ? `out_port(${outPort}), ` : '';
    const _props = JSON.stringify(step.props);

    _log(
      `${prefix} id(${step.id}), ${_name}${_inPort}${_outPort}type(${step.type}), props(${_props})`
    );
  }

  function _attach(pipeline) {
    pipeline
      .on(EXECUTE_START, _executeStart)
      .on(EXECUTE_END, _executeEnd)
      .on(EXECUTE_ERROR, _executeError);
  }

  function _detach(pipeline) {
    pipeline
      .off(EXECUTE_START, _executeStart)
      .off(EXECUTE_END, _executeEnd)
      .off(EXECUTE_ERROR, _executeError);
  }

  function _attachExecutor(executer) {
    executer
      .on(STEP_BEGIN, _stepBegin)
      .on(STEP_END, _stepEnd)
      .on(STEP_ERROR, _stepError);
  }

  function _detachExecutor(executer) {
    executer
      .off(STEP_BEGIN, _stepBegin)
      .off(STEP_END, _stepEnd)
      .off(STEP_ERROR, _stepError);
  }

  function _destroy() {
    _destroyExecutor();

    if (pipeline) {
      _detach(pipeline);
      pipeline = null;
    }

    log = null;
  }

  function _destroyExecutor() {
    if (_executor) {
      _detachExecutor(_executor);
      _executor = null;
    }
  }

  function _executeStart(executor) {
    const allSteps = Object.keys(executor.steps).length;
    _log(`start execute: all_steps(${allSteps})`);
    _attachExecutor(executor);
    _executor = executor;
  }

  function _executeEnd() {
    _log('end execute');
    _destroyExecutor();
  }

  function _executeError(executer, err) {
    _logError('execute error', err);
  }

  function _stepBegin(step, inPort) {
    _logStep('step begin:', step, inPort);
  }

  function _stepEnd(step, outPort) {
    _logStep('step end:  ', step, undefined, outPort);
  }

  function _stepError(step, err) {
    _logError('step error', err);
  }

  return {
    log: _log,
    destroy: _destroy
  };
}

function createDebug(namespace, logger) {
  logger = logger || debug(namespace);
  return (pipeline, name = null) => pipelineDebug(name, pipeline, logger);
}
