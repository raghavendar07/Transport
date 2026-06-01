/** Simulate network latency + optional failures so loading/error states are real in mock mode. */
export function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function deepClone<T>(value: T): T {
  return structuredClone(value)
}
