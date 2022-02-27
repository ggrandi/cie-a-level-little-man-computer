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

export type ToReadable<T> = { [K in keyof T]: T[K] };

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

type DeepKey<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? K extends string
      ? DeepKey<T[K]> extends string
        ? K | `${K}.${DeepKey<T[K]>}`
        : K
      : K
    : K;
}[keyof T];

type DeepHelper<T, Keys extends DeepKey<T>> = {
  [Key in Keys as Key extends `${infer V}.${infer _}` ? V : Key]: Key extends keyof T
    ? null
    : Key extends `${infer _K}.${infer Rest}`
    ? Rest
    : never;
};

export type DeepOmit<T, Keys extends DeepKey<T>> = DeepHelper<T, Keys> extends infer H
  ? {
      [Key in keyof T as Key extends keyof H
        ? H[Key] extends null
          ? never
          : Key
        : Key]: T[Key] extends Record<keyof never, unknown>
        ? Key extends keyof H
          ? H[Key] extends DeepKey<T[Key]>
            ? //@ts-expect-error ignores the casting
              DeepOmit<T[Key], H[Key]>
            : T[Key]
          : T[Key]
        : T[Key];
    }
  : never;

export type DeepPick<T, Keys extends DeepKey<T>> = DeepHelper<T, Keys> extends infer H
  ? {
      [Key in keyof H]: IsUnion<H[Key]> extends true
        ? Key extends keyof T
          ? //@ts-expect-error ignores the casting
            DeepPick<T[Key], H[Key]>
          : never
        : Key extends keyof T
        ? H[Key] extends null
          ? T[Key]
          : H[Key] extends DeepKey<T[Key]>
          ? //@ts-expect-error ignores the casting
            DeepPick<T[Key], H[Key]>
          : never
        : never;
    }
  : never;

export type OneKey<T> = {
  [K in keyof T]: { [Key in K]: T[K] } & {
    [Key in Exclude<keyof T, K>]?: undefined;
  } extends infer Obj
    ? { [ObjK in keyof Obj]: Obj[ObjK] }
    : never;
}[keyof T];
