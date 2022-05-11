interface AsyncExpressMiddleware {
  (reg: any, res: any, next: (err?: Error) => void): Promise<void>;
}

interface MiddlewareOptions {
  idParam?: string;
  debug?: boolean;
  debugNamespace?: string;
  logger?: Function;
  context?: ContextFunction;
}

interface ContextFunction {
  (req: ExpressRequest, res: ExpressResponse): ExpressContext;
}

type ExpressRequest = unknown;
type ExpressResponse = unknown;

interface ExpressContext {
  req: ExpressRequest;
  res: ExpressResponse;
  data?: unknown;
}

interface PipelineInstance {
  on?(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off?(eventName: string | symbol, listener: (...args: any[]) => void): this;
  execute(context: ExpressContext): Promise<ExpressContext>;
}

interface RuleFactory {
  (
    req: ExpressRequest,
    res: ExpressResponse,
    id: string | number | null | undefined
  ): PipelineInstance;
}

type Rules = Record<string, PipelineInstance> | RuleFactory;

declare function ruleEngine(
  rules: Rules,
  options?: MiddlewareOptions
): AsyncExpressMiddleware;

export = ruleEngine;
