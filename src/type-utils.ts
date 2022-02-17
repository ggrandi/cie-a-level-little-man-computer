/** converts a given string into a character array */
export type StrToChars<
  Str extends string,
  Chars extends string[] = []
> = Str extends `${infer Char}${infer Rest}` ? StrToChars<Rest, [...Chars, Char]> : Chars;

/** converts a set of character[] into a string */
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

export type Test<T> = { [K in keyof T]: T[K] };

export type ToReducerActions<T extends Record<string, Record<string, unknown>>> = {
  [K in Exclude<keyof T, "type">]: T[K] extends Record<string, never>
    ? { type: K }
    : { type: K } & T[K];
}[Exclude<keyof T, "type">];
