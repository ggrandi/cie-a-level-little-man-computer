export function isKeyOf<O>(key: unknown, obj: O): key is keyof O {
  return obj && (key as keyof O) in obj;
}

export const isString = (v: unknown): v is string => typeof v === "string";

export const isStringKeyOf = <O>(key: unknown, obj: O): key is string & keyof O =>
  isString(key) && isKeyOf(key, obj);

export const isVoid = (v: unknown): v is void => v === void v;

export const isReadonlyArray = (v: unknown): v is ReadonlyArray<unknown> => Array.isArray(v);
