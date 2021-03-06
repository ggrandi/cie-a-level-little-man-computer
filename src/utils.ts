/** cast a value to a type */
export const cast = <T>(val: T): T => val;

/** ensure a value matches a given type */
export const match =
  <Schema>(): (<T extends Schema>(
    val: T
  ) => keyof Schema extends keyof T ? (keyof T extends keyof Schema ? T : unknown) : unknown) =>
  <T extends Schema>(val: T) =>
    val as never;

/** turns a number into a base n string */
export const toBaseNString = (n: number, base: number, length = 0): string =>
  n.toString(base).padStart(length, "0");

/** makes a string of spaces of the given length */
export const spaceString = (length: number): string => "".padStart(length, " ");

/** pick properties from an object */
export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const newObj: Partial<Pick<T, K>> = {};

  for (const key of keys) {
    newObj[key] = obj[key];
  }

  return newObj as Pick<T, K>;
};

/** sleeps for `ms` milliseconds */
export const sleep = (ms?: number): Promise<void> =>
  new Promise<void>((res) => setTimeout(res, ms));

/** rejects after `ms` milliseconds */
export const sleepReject = (ms?: number, reason?: string): Promise<void> =>
  new Promise<void>((_, rej) => setTimeout(() => rej(reason), ms));
