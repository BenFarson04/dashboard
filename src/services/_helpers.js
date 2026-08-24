// Shared helpers for the mock service layer.
// Each service simulates async latency so the UI's loading/error/empty states are real.
export const delay = (ms = 350) => new Promise(res => setTimeout(res, ms))

// Deterministic-ish random failure for demoing the error state (off by default).
export function maybeFail(rate = 0) {
  if (rate > 0 && Math.random() < rate) {
    throw new Error('Mock service failure (demonstration of the error state).')
  }
}
