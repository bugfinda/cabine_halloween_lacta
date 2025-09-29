## Quick orientation

This is a small, static photobooth app (no build system). The app is served as plain HTML/JS and intended to run on a kiosk/localhost where camera access is allowed.

Key entry points

- `photobooth.html` - main UI loaded by `index.html` (which simply redirects). Contains DOM buttons that call global functions defined in `photobooth.js`.
- `photobooth.js` - primary application logic: camera capture, canvas drawing, overlays, upload flow and idle timer.
- `api.js` - Axios instance used to send uploads to the backend. Base URL: `https://backend.blitzar.com.br/api`.
- `spinner.js` - lightweight spinner helper exposing `setupSpinner()`, `showSpinner()` and `hideSpinner()`.

Why this structure

- Single-file JS and HTML keeps the kiosk footprint small and predictable.
- Overlays/underlays are preloaded in `photobooth.js` to avoid latency when switching frames.

Important patterns and conventions

- Global functions: UI elements call globals (e.g., `pickTemplate`, `takeSnapshot`, `confirmSnapshot`, `cancelSnapshot`, `goBackToStart`). Keep these functions public if they are referenced from markup.
- Canvas size constants: `const WIDTH = 1920; const HEIGHT = 1080;` (see `photobooth.js`). Maintain these when changing templates or overlays.
- Local persistence: `localStorage` keys in use: `machineId` and `cameraIdx` (persisted camera selection and kiosk id). `photobooth.js` reads these on DOMContentLoaded.
- Upload flow: `uploadPhoto(photo)` in `photobooth.js` converts dataURL → Blob → File, appends `formData` and calls `api.post(...)` to a specific materialUpload endpoint. The response must contain `response.data.url` — the code constructs a QR pointing at `https://halloween-lacta.blitzar.com.br/<hashtag>/hosted/?material=${response.data.url}`.
- Authorization: token is read from URL param `token` (fallback to a hardcoded GUID). `api.js` sets `baseURL` and has request/response interceptors. Keep token usage consistent with the existing URL-param approach.
- UX: Idle timer redirects to `photobooth.html` after `maxIdleTimer` seconds (default 90s). Change `maxIdleTimer` in `photobooth.js` only when required.

How to run locally (for development/testing)

- The page needs to be served over HTTP(S) or `localhost` to access the camera. From the project root run a simple static server. Example commands (use in bash / WSL on Windows):

```bash
# Python 3 http server (port 8000)
python -m http.server 8000

# or using npm package 'serve' if you have Node/npm
npx serve -s -l 8000
```

Then open `http://localhost:8000/photobooth.html` in a browser that allows camera access (Chrome/Edge). Check the browser console for errors.

Editing notes (common change locations)

- Add or update overlays/underlays: edit the mapping objects in `photobooth.js` (`overlayPaths` and `underlayPaths`) and ensure files exist under `templates/`.
- Change backend endpoints or base URL: edit `api.js` (single source for baseURL). The upload path is currently hard-coded in `photobooth.js`.
- Modify upload behavior (metadata, properties): update `formData` in `uploadPhoto` inside `photobooth.js`.
- Spinner appearance or behavior: edit `spinner.js` functions; spinner DOM is created on DOMContentLoaded.

Debugging tips

- If camera doesn't start: check console for MediaDevice errors. Confirm `navigator.mediaDevices.enumerateDevices()` returns `videoinput` devices.
- If uploads fail: open Network tab, inspect the POST to the materialUpload endpoint and the response body. `photobooth.js` expects `response.data.url`.
- QR generation: uses `lib/qrcode.min.js`. If QR appears blank, validate `qrCodeValue` constructed in the upload success handler.

Agent guidance (what to do first when changing code)

- Keep changes minimal and test in a browser (camera + upload). This repo has no automated tests.
- Preserve global function names used by markup. If you refactor to modules, update `photobooth.html` to import or expose the functions accordingly.

Files to inspect for examples

- `photobooth.js` — camera lifecycle, overlay drawing, `uploadPhoto()`
- `api.js` — axios client and interceptors
- `spinner.js` — spinner DOM and show/hide helpers
- `photobooth.html` — markup references to global functions and assets

If anything is unclear or you want me to expand any section (run steps, test harness, or make the repo resilient to offline mode), tell me which area to expand and I will update this file.
