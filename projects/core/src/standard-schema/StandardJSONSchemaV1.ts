/** The Standard JSON Schema interface, from https://standardschema.dev/json-schema. */
export interface StandardJSONSchemaV1<Input = unknown, Output = Input> {
  /** The Standard JSON Schema properties. */
  readonly '~standard': StandardJSONSchemaV1.Props<Input, Output>
}

export declare namespace StandardJSONSchemaV1 {
  /** The Standard JSON Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1
    /** The vendor name of the schema library. */
    readonly vendor: string
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined
    /** Methods for generating the input/output JSON Schema. */
    readonly jsonSchema: Converter
  }

  /** The Standard JSON Schema converter interface. */
  export interface Converter {
    /** Converts the input type to JSON Schema. May throw if conversion is not supported. */
    readonly input: (options: Options) => Record<string, unknown>
    /** Converts the output type to JSON Schema. May throw if conversion is not supported. */
    readonly output: (options: Options) => Record<string, unknown>
  }

  /** The target version of the generated JSON Schema. */
  export type Target =
    | 'draft-2020-12'
    | 'draft-07'
    | 'openapi-3.0'
    | ({} & string)

  /** The options for the converter methods. */
  export interface Options {
    /** The target version of the generated JSON Schema. */
    readonly target: Target
    /** Explicit support for additional vendor-specific parameters, if needed. */
    readonly libraryOptions?: Record<string, unknown> | undefined
  }

  /** The Standard types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input
    /** The output type of the schema. */
    readonly output: Output
  }

  // biome-ignore lint/complexity/noUselessEmptyExport: needed for granular visibility control of TS namespace
  export {}
}
