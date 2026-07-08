// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// If `npm run build` fails with "EPERM: operation not permitted, rename
// '.tanstack/tmp/...' -> 'src/routeTree.gen.ts'": the TanStack Start route
// generator left a stale temp file from a previously interrupted build
// (Ctrl+C mid-generation, AV briefly locking the file, etc). That partial
// generation also skips populating globalThis.TSS_ROUTES_MANIFEST, which
// then crashes the SSR manifest plugin with "Cannot convert undefined or
// null to object". `npm run build` now runs `npm run clean` first
// (see package.json `prebuild`) to wipe `.tanstack`/`.output` defensively —
// if it still happens, delete `.tanstack` by hand and rebuild.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
