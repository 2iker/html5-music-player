# AGENTS.md

## Project

Static HTML5 music player (vanilla JS, no build system). Search & play songs from NetEase Cloud Music via a Vercel proxy API.

## Running locally

```bash
npx serve .
# or
python -m http.server 8080
```

Open `index.html` directly also works (no bundling needed).

## Architecture

- `index.html` — single page, loads APlayer + jQuery + AmazeUI from CDN
- `script.js` — all logic: search, player init, lyrics fetch, load-more pagination
- `style.css` — dark theme, responsive, customizes APlayer/AmazeUI styles
- API proxy: `https://api-enhanced-two-mu.vercel.app` (hardcoded in `script.js:2`)

## Key details

- No `package.json`, no linting, no tests, no build step.
- Dependencies are CDN-loaded: APlayer 1.10.1, jQuery 3.6.0, AmazeUI 2.7.2.
- Cache busting via `style.css?v=30` query string in `index.html`.
- Audio URLs use NetEase direct link pattern: `https://music.163.com/song/media/outer/url?id={id}.mp3`
- Lyric fetch has 8s timeout per song in `convertToPlayerList`; search has 15s abort timeout.
- All JS is in a single file with no modules/bundler — global scope, no strict mode.
