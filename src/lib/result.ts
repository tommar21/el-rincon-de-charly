/**
 * Result type for consistent error handling across services.
 *
 * Instead of mixing return types (null, boolean, throw, { error }),
 * use Result<T, E> for a unified approach.
 *
 * @example
 * ```ts
 * async function fetchUser(id: string): Promise<Result<User>> {
 *   try {
 *     const user = await db.users.findById(id);
 *     if (!user) return err(new Error('User not found'));
 *     return ok(user);
 *   } catch (e) {
 *     return err(e as Error);
 *   }
 * }
 *
 * // Usage
 * const result = await fetchUser('123');
 * if (result.ok) {
 *   console.log(result.value.name);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */

/**
 * Represents a successful result containing a value
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * Represents a failed result containing an error
 */
export interface Err<E = Error> {
  readonly ok: false;
  readonly error: E;
}

/**
 * A discriminated union representing either success or failure
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Create a successful result
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Create a failed result
 */
export function err<E = Error>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Check if a result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/**
 * Check if a result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value if it's an error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Map a successful result to a new value
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/**
 * Map an error result to a new error
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

/**
 * Chain multiple Result-returning operations
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Convert a Promise that might throw to a Result
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

/**
 * Convert a nullable value to a Result
 */
export function fromNullable<T>(
  value: T | null | undefined,
  errorMsg = 'Value is null or undefined'
): Result<T, Error> {
  return value != null ? ok(value) : err(new Error(errorMsg));
}
