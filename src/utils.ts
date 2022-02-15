export const cast = <T>(val: T) => val;

export const match =
  <Schema>() =>
  <T extends Schema>(
    val: T
  ): keyof Schema extends keyof T ? (keyof T extends keyof Schema ? T : void) : void =>
    val as any;

export const toBaseNString = (n: number, base: number, length = 0) =>
  n.toString(base).padStart(length, "0");

export const spaceString = (length: number) => "".padStart(length, " ");
