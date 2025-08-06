/// <reference types="vite/client" />

declare module 'papaparse' {
  export interface ParseConfig<T = any> {
    header?: boolean;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: any) => void;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean;
    delimitersToGuess?: string[];
  }

  export interface ParseResult<T = any> {
    data: T[];
    errors: any[];
    meta: any;
  }

  export function parse<T = any>(
    input: string | File,
    config?: ParseConfig<T>
  ): ParseResult<T>;
}
