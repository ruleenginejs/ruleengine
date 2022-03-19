export interface HandlerFunction<T = Context> {
  (context: T, next: NextFunction): void;
  (context: T, port: string, next: NextFunction): void;
  (context: T, port: string, props: PlainObject, next: NextFunction): void;
  (err: Error, context: T, port: string, props: PlainObject, next: NextFunction): void;
}

export interface NextFunction {
  (portOrError?: string | Error): void;
}

export type StepId = string | number;

export type Context = Object;

export type PlainObject = Record<string, unknown>;

export interface StepOptions {
  id?: StepId;
  name?: string;
  handler?: HandlerFunction;
  ports?: { in?: Array<string>, out?: Array<string> };
  props?: PlainObject;
}

export interface ConnectionDefinition {
  stepId: StepId;
  srcOutPort: string;
  dstInPort: string;
}

export interface Step {
  readonly id: number;
  readonly name: string | null;
  readonly handler: HandlerFunction | null;
  readonly ports: { in: Record<string, boolean>, out: Record<string, boolean> }
  readonly type: string | null;
  readonly props: PlainObject;
  readonly connections: { [srcOutPort: string]: ConnectionDefinition };

  addInPorts(ports: Array<string>): void;
  addOutPorts(ports: Array<string>): void;
  enableInPort(port: string, value: boolean): void;
  enableOutPort(port: string, value: boolean): void;
  inPortEnabled(port: string): boolean;
  outPortEnabled(port: string): boolean;
  hasInPort(port: string): boolean;
  hasOutPort(port: string): boolean;
  connectTo(stepOrId: Step | StepId, srcOutPort?: string, dstInPort?: string): void;
  getConnection(srcOutPort?: string): ConnectionDefinition;
}

export interface StepConstructor<T extends Step = Step> {
  new(options?: StepOptions): T;

  newId(): number;
}

export const Step: StepConstructor;

export interface ErrorStep extends Step {
  readonly type: string;
}

export interface EndStep extends Step {
  readonly type: string;
}

export interface StartStep extends Step {
  readonly type: string;
}

export interface SingleStep extends Step {
  readonly type: string;
}

export interface CompositeStep extends Step {
  readonly type: string;
  readonly startStep: Step | null;
  readonly endStep: Step | null;
  readonly steps: Record<StepId, Step>;

  setStartStep(step: Step): this;
  setEndStep(step: Step): this;
  add(...steps: Step[]): this;
  remove(stepOrId: Step | StepId): this;
  getStep(stepId: StepId): Step | null;
}

export type ErrorStepConstructor = StepConstructor<ErrorStep>;
export type StartStepConstructor = StepConstructor<StartStep>;
export type EndStepConstructor = StepConstructor<EndStep>;
export type SingleStepConstructor = StepConstructor<SingleStep>;
export type CompositeStepConstructor = StepConstructor<CompositeStep>;

export const ErrorStep: ErrorStepConstructor;
export const StartStep: StartStepConstructor;
export const EndStep: EndStepConstructor;
export const SingleStep: SingleStepConstructor;
export const CompositeStep: CompositeStepConstructor;

export interface EventEmmiter {
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
}

export interface Pipeline extends EventEmmiter {
  readonly steps: Record<StepId, Step>;
  readonly startStep: Step | null;
  readonly errorStep: Step | null;

  add(...steps: Step[]): this;
  remove(stepOrId: Step | StepId): this;
  getStep(stepId: StepId): Step | null;
  execute<T extends Context = Context>(context?: T): Promise<T>;
  createExecutor(): StepExecutor;
}

export interface PipelineOptions {
  stepExecutor?: StepExecutor;
}

export interface PipelineConstructor<T = Pipeline> {
  new(options?: PipelineOptions): T;
}

export interface StepExecutor extends EventEmmiter {
  start(context: Context): Promise<Context>;
}

export interface StepExecutorConstructor<T = StepExecutor> {
  new(startStep: Step | null, errorStep: Step | null, steps: Record<StepId, Step>): T;
}

export const Pipeline: PipelineConstructor;
export const StepExecutor: StepExecutorConstructor;

export class StepExecutorError extends Error {
  constructor(message: string, cause?: Error, inner?: Error);
  readonly cause?: Error;
  readonly inner?: Error;
}
