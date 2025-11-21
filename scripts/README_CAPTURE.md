# Capture screenshots and a short video

This project includes a Playwright-based script to generate marketing assets from your running site.

Outputs are written inside the app so you can use them immediately:

- `public/media/screens/home-hero-light.png`
- `public/media/screens/home-hero-dark.png`
- `public/media/video/home-hero-walkthrough.webm` (1280x720)

## 1) Install Playwright (one-time)

```powershell
npm run capture:media:install
```

This installs the `playwright` dev dependency and the browser binaries.

## 2) Make sure the app is running

```powershell
npm start
```

This starts both the API and the Vite dev server. The capture script defaults to `http://localhost:5173`. To capture against another URL, set `APP_URL`.

```powershell
$env:APP_URL="http://localhost:5173"; npm run capture:media
```

## 3) Capture screenshots + video

```powershell
npm run capture:media
```

After it finishes, check:

- `public/media/screens/` for PNG screenshots
- `public/media/video/` for the WebM video

You can upload these files directly or reference them in the site (they are already inside `public/`).

## Notes

- The script toggles dark mode by clicking the "Dark" button if present.
- To capture more pages or flows, duplicate the steps in `scripts/capture_media.mjs` and add additional `page.goto(...)` + `screenshot(...)` blocks.


