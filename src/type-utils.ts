/** converts a given string into a character array */
export type StrToChars<
  Str extends string,
  Chars extends string[] = []
> = Str extends `${infer Char}${infer Rest}` ? StrToChars<Rest, [...Chars, Char]> : Chars;

/** converts a character[] into a string */
export type CharsToStr<Chars extends string[], Str extends string = ""> = Chars extends [
  infer Next,
  ...infer Rest
]
  ? Rest extends string[]
    ? Next extends string
      ? CharsToStr<Rest, `${Str}${Next}`>
      : never
    : never
  : Str;

/**
 * Gets the last value from an array
 * @returns [Last, RestOfChars[]]
 */
export type Last<T extends unknown[]> = T extends [...infer Rest, infer L] ? [L, Rest] : [T[0], []];

export type MapKey<T extends Map<unknown, unknown>> = T extends Map<infer K, unknown> ? K : never;

export type ToReadable<T> = T extends Record<string, unknown>
  ? { [K in keyof T]: ToReadable<T[K]> }
  : T;

export type ToReducerActions<T extends Record<string, Record<string, unknown>>> = {
  [K in Exclude<keyof T, "type">]: T[K] extends Record<string, never>
    ? { type: K }
    : { type: K } & T[K] extends infer V
    ? { [VKey in keyof V]: V[VKey] }
    : { type: K };
}[Exclude<keyof T, "type">];

export type Optional<T> = { property?: T }["property"];

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export type IsUnion<U> = [U] extends [UnionToIntersection<U>] ? false : true;

/** returns whether a given type is never */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Allows you to deeply pick values
 * ```
 * type Obj = { a: { b: { c: 1 }; d?: { e: 2; f: 3 } } }
 * type R1 = DeepPick<Obj, "a.b">;
 * -> { a: { b: { c: 1 }}}
 * type R2 = DeepPick<Obj, "a.b" | "a.d.e">;
 * -> { a: { b: { c: 1 }; d?: { e: 2 } | undefined } }
 * ```
 * @see Pick
 */
export type DeepPick<T, K extends DeepKey<T>> = ToReadable<UnionToIntersection<DeepPickOne<T, K>>>;

type DeepKey<T, Prepend extends string = ""> = T extends Record<string, unknown>
  ? {
      [K in Extract<keyof T, string>]: `${Prepend}${K}` | `${Prepend}${K}${DeepKey<T[K], ".">}`;
    }[Extract<keyof T, string>]
  : "";

type DeepPickOne<T, K extends string> =
  // checks to see if there is a nested key
  K extends `${infer Key}.${infer Rest}`
    ? // check if the key is actually a key in the object
      Key extends keyof T
      ? // check if the key is optional
        T[Key] extends Required<T>[Key]
        ? { [TKey in Key]: DeepPickOne<T[TKey], Rest> }
        : { [TKey in Key]?: DeepPickOne<Required<T>[TKey], Rest> }
      : { [TKey in Key]: unknown }
    : // if there is no nested key, check if the key is a key in the object
    K extends keyof T
    ? // check if the key is optional
      T[K] extends Required<T>[K]
      ? { [TKey in K]: T[K] }
      : { [TKey in K]?: T[K] }
    : unknown;

type DeepKeyToObj<K extends DeepKey<Record<string, unknown>>> = UnionToIntersection<
  K extends `${infer Key}.${infer Rest}`
    ? { [TKey in Key]: DeepKeyToObj<Rest> }
    : { [TKey in K]: never }
>;

/**
 * Deeply omits values from an object
 * ```
 * type Obj = { a: { b: { c: 1 }; d?: { e: 2; f: 3 } } }
 * type R1 = DeepOmit<Obj, "a.b">;
 * -> { a: { d?: { e: 2; f: 3 } } }
 * type R2 = DeepOmit<Obj, "a.b" | "a.d.e">;
 * -> { a: { d?: { f: 3 } | undefined } }
 * ```
 * @see Omit
 */
export type DeepOmit<T, K extends DeepKey<T>> = ToReadable<DeepOmitHelper<T, DeepKeyToObj<K>>>;

type DeepOmitHelper<T, KeyObj> = {
  // omits all the required attributes from the object
  [Key in Extract<keyof T, string> as T[Key] extends Required<T>[Key]
    ? // checks if it is in the key object of keys to omit
      Key extends keyof KeyObj
      ? // if it is in the key object as never, omit it
        IsNever<KeyObj[Key]> extends true
        ? never
        : // if it needs to be omitted, leave it
          Key
      : Key
    : never]: Key extends keyof KeyObj // if it is in the key object, pass it to be handled later
    ? DeepOmitHelper<T[Key], KeyObj[Key]>
    : // if it doesnt need to be omitted leave it as is
      T[Key];
} & {
  // omits all the partial attributes from the object
  //                                  checks if it is a partial attribute
  [Key in Extract<keyof T, string> as T[Key] extends Required<T>[Key]
    ? never
    : // omit if needed to be omitted
    Key extends keyof KeyObj
    ? IsNever<KeyObj[Key]> extends true
      ? never
      : Key
    : Key]?: Key extends keyof KeyObj
    ? DeepOmitHelper<Required<T>[Key], KeyObj[Key]>
    : Required<T>[Key];
};

export type OneKey<T> = {
  [K in keyof T]: { [Key in K]: T[K] } & {
    [Key in Exclude<keyof T, K>]?: undefined;
  } extends infer Obj
    ? { [ObjK in keyof Obj]: Obj[ObjK] }
    : never;
}[keyof T];

export type Nullable<T> = T | null;
