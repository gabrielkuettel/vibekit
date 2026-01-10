/**
 * Lazy initialization utility
 *
 * Creates a getter that initializes the value on first access.
 */

export function lazy<T>(factory: () => T): () => T {
  let instance: T | null = null
  return () => instance ?? (instance = factory())
}
