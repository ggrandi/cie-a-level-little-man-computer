export const cast = <T>(val: T): T => val;

export const match = <Schema>(): (<T extends Schema>(
  val: T,
) => keyof Schema extends keyof T ? (keyof T extends keyof Schema ? T : void) : void) =>
  <T extends Schema>(val: T) =>
    // deno-lint-ignore no-explicit-any
    val as any;

// deno-lint-ignore explicit-module-boundary-types
export const toBaseNString = (n: number, base: number, length = 0): string =>
  n.toString(base).padStart(length, "0");

export const spaceString = (length: number): string => "".padStart(length, " ");
