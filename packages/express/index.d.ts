interface AsyncExpressMiddleware {
  (reg: any, res: any, next: (err?: Error) => void): Promise<void>;
}

interface RuleMiddlewareOptions {
  idParam?: string;
  debug?: boolean;
  debugNamespace?: string;
  logger?: Function;
  context?: Function;
}

type Rules = { [key: string]: unknown } | Function;

declare function ruleEngine(rules: Rules, options?: RuleMiddlewareOptions): AsyncExpressMiddleware;

export = ruleEngine;
