interface GenerateOptions {
  baseDir?: string;
  runtimeModule?: string;
}

type CompilerOptions = GenerateOptions;

export function compile(input: Object, options?: CompilerOptions): any;
export function generateCode(input: Object, options?: GenerateOptions): string;
