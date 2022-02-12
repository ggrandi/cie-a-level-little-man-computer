export function isKeyOf<O>(key: unknown, obj: O): key is keyof O {
  return obj && (key as keyof O) in obj;
}

export const isString = (v: unknown): v is string => typeof v === "string";

export function isStringKeyOf<O>(
  key: unknown,
  obj: O
): key is string & keyof O {
  return isString(key) && isKeyOf(key, obj);
}
