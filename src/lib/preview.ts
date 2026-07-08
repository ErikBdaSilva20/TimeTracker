/**
 * True when the app is running in preview mode: either the editor
 * explicitly flags it via `window.__MASI_PREVIEW__` (Sandpack/editor
 * preview, injected at runtime), or there's no gateway configured at all
 * (local dev without `VITE_GATEWAY_URL`). Both cases fall back to
 * `preview-fixtures.ts` instead of hitting a real backend — see
 * `src/routes/__root.tsx`.
 *
 * Single source of truth for that condition so it isn't reimplemented (and
 * risks drifting) everywhere it's needed — `__root.tsx` uses it to decide
 * whether to install the fixture fetch interceptor, `LoginScreen` uses it to
 * gate the demo-credentials shortcut (audit 5.3 — that shortcut was
 * previously shown unconditionally, even in a real deployed tenant).
 */
export function isPreviewMode(): boolean {
  const flagged =
    typeof window !== "undefined" &&
    (window as unknown as { __MASI_PREVIEW__?: boolean }).__MASI_PREVIEW__ === true;
  return flagged || !import.meta.env.VITE_GATEWAY_URL;
}
