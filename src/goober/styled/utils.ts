/** prefix a string with a $ */
export type ParamName<T extends string> = `$${T}`;
/** prefix all the keys of a record with a $ */
export type AsParamNames<T extends Record<string, unknown>> = {
  [K in Extract<keyof T, string> as ParamName<K>]: T[K];
};
