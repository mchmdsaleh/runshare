# RunShare

RunShare is a web app for turning running activity files into clean, shareable visual cards and captions.

It supports both `.csv` and `.fit` uploads, normalizes activity data in-browser, and exports transparent PNG assets optimized for social sharing.

## Features

- Upload and parse:
  - Garmin-style `.csv`
  - `.fit` activity files
- Review and edit parsed split rows before export
- Multiple export templates:
  - `Minimal Overlay`
  - `Split`
  - `Classic Summary`
- Dynamic route rendering in `Minimal Overlay` for FIT files with GPS records
- Split controls for interval activities:
  - Include Warm Up
  - Include Cool Down
  - Include Rest
- Text output modes:
  - Clean
  - Coach Mode
  - Social Caption
- Image export:
  - Story (`1080x1920`)
  - Square (`1080x1080`)
  - Custom dimensions
- Copy utilities:
  - Copy caption text
  - Copy PNG to clipboard (browser support required)

## Tech Stack

- React + Vite
- Vanilla CSS
- `papaparse` for CSV parsing
- `fit-file-parser` for FIT parsing
- `html-to-image` for PNG export
- `lucide-react` icons

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

Open:

- `http://localhost:4173/`

### 3. Production build

```bash
npm run build
```

## Usage Flow

1. Upload `.csv` or `.fit`
2. Review parsed rows and edit values as needed
3. Pick export template + options
4. Copy text / copy PNG / download PNG

## FIT Parsing Notes

- RunShare classifies FIT laps into activity segments (`interval`, `rest`, `warmup`, `cooldown`, or general `run`) based on FIT metadata.
- For structured interval FIT sessions, split options can include WU/CD/Rest.
- For FIT activities with GPS records, route points are rendered in `Minimal Overlay`.

## Project Structure

```text
src/
  components/
    export/
    layout/
    preview/
    templates/
    upload/
  lib/
    csvParser.js
    fitParser.js
    normalizer.js
    formatUtils.js
    textGenerator.js
    exportImage.js
  App.jsx
  main.jsx
  index.css
```

## Browser Compatibility

- Modern Chromium-based browsers are recommended.
- Clipboard image copy (`Copy`) requires Clipboard API support for `image/png`.

## License

This repository currently has no explicit license file. Add one before public distribution.
