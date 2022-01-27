interface Logger {
  (formatter: any, ...args: any[]): void;
}

interface DebugFactory {
  (pipeline: EventablePipeline, name?: string): PipelineDebugger;
}

interface PipelineDebugger {
  log: Logger;
  destroy(): void;
}

interface EventablePipeline {
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
}

declare function createDebug(namespace: string, logger?: Logger): DebugFactory;

declare namespace createDebug {
  export { pipelineDebug };
}

declare function pipelineDebug(name: string | null, pipeline: EventablePipeline, log: Logger): PipelineDebugger;

export = createDebug;
