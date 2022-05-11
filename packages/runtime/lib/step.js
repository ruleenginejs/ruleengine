class Step {
  constructor(options = {}) {
    if (!options) {
      options = {};
    }

    const { id, name, handler, ports, props } = options;

    if (id === null || id === undefined) {
      this.id = Step.newId();
    } else if (typeof id === 'string' || typeof id === 'number') {
      this.id = id;
    } else {
      throw new TypeError('id must be string or number');
    }

    if (name === null || name === undefined) {
      this.name = null;
    } else if (typeof name === 'string') {
      this.name = name;
    } else {
      throw new TypeError('name must be string');
    }

    if (handler === null || handler === undefined) {
      this.handler = null;
    } else if (typeof handler === 'function') {
      this.handler = handler;
    } else {
      throw new TypeError('handler expected must be function');
    }

    this.ports = {
      in: { default: true },
      out: { default: true }
    };

    if (ports) {
      this.addInPorts(ports.in);
      this.addOutPorts(ports.out);
    }

    this.type = null;
    this.props = { ...props };
    this.connections = {};
  }

  _addPorts(direction, portArray) {
    if (Array.isArray(portArray)) {
      portArray.forEach(port => {
        if (typeof port === 'string') {
          this.ports[direction][port] = true;
        } else {
          throw new TypeError('port name must be string');
        }
      });
    }
  }

  _enablePort(direction, port, value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('value arg must be boolean');
    }
    if (port in this.ports[direction]) {
      this.ports[direction][port] = value;
    } else {
      throw new Error(`port name doesn't exists: ${port}`);
    }
  }

  _portEnabled(direction, port) {
    if (port in this.ports[direction]) {
      return this.ports[direction][port];
    } else {
      throw new Error(`port name doesn't exists: ${port}`);
    }
  }

  _hasPort(direction, port) {
    return port in this.ports[direction];
  }

  _checkId(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
      throw new TypeError('id must be string or number');
    }
  }

  _checkPort(direction, port) {
    if (typeof port !== 'string') {
      throw new TypeError('port name must be string');
    }
    if (!(port in this.ports[direction])) {
      throw new Error(`port name doesn't exists: ${port}`);
    }
  }

  addInPorts(portArray) {
    this._addPorts('in', portArray);
  }

  addOutPorts(portArray) {
    this._addPorts('out', portArray);
  }

  enableInPort(port, value) {
    this._enablePort('in', port, value);
  }

  enableOutPort(port, value) {
    this._enablePort('out', port, value);
  }

  inPortEnabled(port) {
    return this._portEnabled('in', port);
  }

  outPortEnabled(port) {
    return this._portEnabled('out', port);
  }

  hasInPort(port) {
    return this._hasPort('in', port);
  }

  hasOutPort(port) {
    return this._hasPort('out', port);
  }

  connectTo(stepOrId, srcOutPort = null, dstInPort = null) {
    let stepId;

    if (stepOrId instanceof Step) {
      stepId = stepOrId.id;
    } else {
      this._checkId(stepOrId);
      stepId = stepOrId;
    }

    if (srcOutPort === null || srcOutPort === undefined) {
      srcOutPort = 'default';
    }

    if (dstInPort === null || dstInPort === undefined) {
      dstInPort = 'default';
    }

    this._checkPort('out', srcOutPort);

    if (stepOrId instanceof Step) {
      stepOrId._checkPort('in', dstInPort);
    }

    this.connections[srcOutPort] = {
      stepId,
      srcOutPort,
      dstInPort
    };
  }

  getConnection(srcOutPort) {
    if (srcOutPort === null || srcOutPort === undefined) {
      srcOutPort = 'default';
    }

    this._checkPort('out', srcOutPort);

    if (!(srcOutPort in this.connections)) {
      return null;
    }

    return this.connections[srcOutPort];
  }
}

Step._id = 0;
Step.newId = () => ++Step._id;

module.exports = Step;
