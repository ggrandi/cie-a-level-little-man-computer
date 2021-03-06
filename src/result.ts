/** Result pattern from Rust */
export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

/** representation of the ok side of a result */
export type Ok<R extends Result<unknown, unknown>> = R extends { ok: true } ? R : never;
export const Ok = <T>(data: T): Ok<Result<T, unknown>> => ({
  ok: true,
  data: data,
});

/** representation of the error side of a result */
export type Err<R extends Result<unknown, unknown>> = R extends { ok: false } ? R : never;
export const Err = <E>(error: E): Err<Result<unknown, E>> => ({
  ok: false,
  error,
});

/** utility to check if a result is ok */
export const isOk = <R extends Result<unknown, unknown>>(result: R): result is Ok<R> => result.ok;

/** utility to check if a result is an err */
export const isErr = <R extends Result<unknown, unknown>>(result: R): result is Err<R> =>
  !result.ok;
