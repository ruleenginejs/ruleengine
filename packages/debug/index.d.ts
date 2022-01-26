interface Logger {
  (formatter: any, ...args: any[]): void;
}

interface PipelineDebugFactory {
  (pipeline: PipelineEvents, name?: string): PipelineDebugger;
}

interface PipelineDebugger {
  log: Logger;
  destroy(): void;
}

interface PipelineEvents {
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

declare function createDebug(namespace: string, logger?: Logger): PipelineDebugFactory;

declare namespace createDebug {
  export { pipelineDebug };
}

declare function pipelineDebug(name: string | null, pipeline: PipelineEvents, log: Logger): PipelineDebugger;

export = createDebug;
