interface GenerateOptions {
  baseDir?: string;
  runtimeModule?: string;
  esModule?: boolean;
}

type CompilerOptions = GenerateOptions;

export function compile(input: Object, options?: CompilerOptions): any;
export function generateCode(input: Object, options?: GenerateOptions): string;
