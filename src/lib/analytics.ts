/**
 * Thin, safe wrapper around the Umami tracker.
 *
 * `window.umami` only exists once the tracker script (loaded via
 * `src/components/analytics.tsx`) has initialized — and only in production
 * where the env vars are set. Every call is guarded so it's a no-op in dev,
 * during SSR, or if the script is blocked, never throwing.
 *
 * @see https://umami.is/docs/track-events
 */

type UmamiTracker = {
  track: (eventName: string, eventData?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(eventName, eventData);
  } catch {
    // Analytics must never break the app.
  }
}
