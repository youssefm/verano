# AGENTS.md

## Dev device simulator

Verano has a dev-only device simulator for browser automation and visual inspection. The simulator and dev client wrapper live together in `src/lib/deviceSimulator.ts` and are selected through the device-layer client factory in `src/lib/deviceClient.ts` only when `import.meta.env.DEV` is true. Do not add simulator state or controls to `App.tsx`; keep simulation at the device layer so the app exercises the normal Bluetooth-facing paths.

In Vite dev mode, the simulator exposes this browser API:

```js
window.__veranoDevice.connect();
window.__veranoDevice.disconnect();
window.__veranoDevice.sample({ posA: 500, posB: 480 });
window.__veranoDevice.rep();
window.__veranoDevice.reps(5);
window.__veranoDevice.completeWarmup();
window.__veranoDevice.completeWorking(8);
window.__veranoDevice.state();
```

Typical Playwright flow:

1. Start the Vite dev server using **async mode** in the bash tool (so it stays alive across commands) on a safe port:
   ```sh
   # Use async mode — sync background processes die between bash calls.
   # Port 5173 is blocked by Chromium; use port 8080 instead.
   cd /repos/verano && npx vite --host 0.0.0.0 --port 8080
   ```
2. Open `http://127.0.0.1:8080/`.
3. Seed or create an exercise if needed.
4. Run `window.__veranoDevice.connect()`.
5. Start the exercise through the existing UI.
6. Use `rep()`, `reps(count)`, `completeWarmup()`, or `completeWorking(reps)` to inspect workout states.

### Playwright gotchas

- **Chromium blocks port 5173.** Chrome considers certain ports unsafe and silently refuses connections with `ERR_CONNECTION_REFUSED`. Port 8080 works reliably.
- **The Vite dev server must run in an async bash session.** Sync-mode background processes (`&`) are killed when the bash session ends, so the server disappears before the next command. Use `mode="async"` with a `shellId` to keep it alive.
- **Static HTML files** can be served by placing them in the `public/` directory; Vite serves them at the root path (e.g., `public/foo.html` → `http://127.0.0.1:8080/foo.html`).

## Validation

Use these checks after code changes:

```sh
npm run lint
npm run build -- --emptyOutDir
```

Playwright CLI artifacts are written under `.playwright-cli/` and are git-ignored.
