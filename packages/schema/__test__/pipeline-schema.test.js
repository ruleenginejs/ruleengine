const schema = require('..');

const SCHEMA_ID = schema.SCHEMAS.PIPELINE;

describe('pipeline-schema', () => {
  let validate;

  beforeAll(() => {
    validate = schema(SCHEMA_ID, { allErrors: true });
  });

  it('required root props', () => {
    expect(
      validate({
        steps: []
      })
    ).toBe(true);
  });

  it('required start, end, error step props', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start'
          },
          {
            id: 2,
            type: 'end'
          },
          {
            id: 3,
            type: 'error'
          }
        ]
      })
    ).toBe(true);
  });

  it('required single step props', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'single'
          },
          {
            id: 1,
            type: 'single'
          }
        ]
      })
    ).toBe(true);
  });

  it('required composite step props', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'composite',
            steps: []
          }
        ]
      })
    ).toBe(true);
  });

  it('start step min', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start'
          }
        ]
      })
    ).toBe(true);
  });

  it('start step ports', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            ports: {
              in: ['default'],
              out: ['default']
            }
          }
        ]
      })
    ).toBe(true);
  });

  it('start step name', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            name: 'Some step'
          }
        ]
      })
    ).toBe(true);
  });

  it('start step props', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            props: {
              prop1: [1, 3],
              prop2: 'text',
              prop3: false
            }
          }
        ]
      })
    ).toBe(true);
  });

  it('start step connect', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            connect: [
              {
                stepId: 2,
                srcOutPort: 'default',
                dstInPort: 'default'
              }
            ]
          }
        ]
      })
    ).toBe(true);
  });

  it('start step connect with name', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            connect: [
              {
                stepId: 2,
                srcOutPort: 'default',
                dstInPort: 'default',
                name: 'Some connect'
              }
            ]
          }
        ]
      })
    ).toBe(true);
  });

  it('should no required srcOutPort and dstInPort in step connection', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            connect: [
              {
                stepId: 2
              }
            ]
          }
        ]
      })
    ).toBe(true);
  });

  it('should valid when no srcOutPort and dstInPort', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            connect: [
              {
                stepId: 2
              }
            ]
          }
        ]
      })
    ).toBe(true);
  });

  it('should valid when root title is string', () => {
    expect(
      validate({
        title: 'Some title',
        steps: []
      })
    ).toBe(true);
  });

  it('should valid when root description is string', () => {
    expect(
      validate({
        description: 'Some description',
        steps: []
      })
    ).toBe(true);
  });

  it('should valid when start, end, error steps contains canvas property', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'start',
            canvas: {
              prop1: 'prop1'
            }
          },
          {
            id: 2,
            type: 'end',
            canvas: {
              prop1: 'prop1'
            }
          },
          {
            id: 2,
            type: 'error',
            canvas: {
              prop1: 'prop1'
            }
          }
        ]
      })
    ).toBe(true);
  });

  it('should valid when single step contains canvas property', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'single',
            handlerFile: './step.js',
            canvas: {
              prop1: 'prop1'
            }
          }
        ]
      })
    ).toBe(true);
  });

  it('should valid when composite step contains canvas property', () => {
    expect(
      validate({
        steps: [
          {
            id: 1,
            type: 'composite',
            startId: 2,
            endId: 3,
            steps: [],
            canvas: {
              prop1: 'prop1'
            }
          }
        ]
      })
    ).toBe(true);
  });
});
