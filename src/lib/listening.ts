/** A clip must play for this long, or for its full length if it is shorter. The value comes from TTS Arena. */
export const MIN_LISTEN_MS = 3000;

/** Time a rater needs to hear the required part of both clips, one after the other. */
export function requiredListenMs(durationAMs: number, durationBMs: number): number {
  return Math.round(Math.min(MIN_LISTEN_MS, durationAMs) + Math.min(MIN_LISTEN_MS, durationBMs));
}

/**
 * The server knows when it sent each clip. A vote is too early if less than the
 * required time has passed since the later of the two. Returns the time since
 * then in milliseconds, or null if the rater has not loaded both clips.
 */
export function listenedMs(aServedAt: string | null, bServedAt: string | null, now: number): number | null {
  if (!aServedAt || !bServedAt) return null;
  return now - Math.max(Date.parse(aServedAt), Date.parse(bServedAt));
}
