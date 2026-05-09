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

1. Start the app with `npm run dev -- --host 127.0.0.1 --port 5173`.
2. Open `http://127.0.0.1:5173/`.
3. Seed or create an exercise if needed.
4. Run `window.__veranoDevice.connect()`.
5. Start the exercise through the existing UI.
6. Use `rep()`, `reps(count)`, `completeWarmup()`, or `completeWorking(reps)` to inspect workout states.

## Validation

Use these checks after code changes:

```sh
npm run lint
npm run build -- --emptyOutDir
```

Playwright CLI artifacts are written under `.playwright-cli/` and are git-ignored.
