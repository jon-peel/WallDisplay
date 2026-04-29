# WallDisplay

An ambient display that shows a photo slideshow, live weather, or a video wall. Compiles to fully static HTML/CSS/JS.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your photos

Copy JPEG, PNG, or WebP images into the `photos/` directory:

```
photos/
  my-landscape-photo.jpg
  my-portrait-photo.jpg
  ...
```

### 3. Configure `config.json`

Edit `config.json` at the project root:

```json
{
  "defaultMode": "slideshow",
  "slideshowInterval": 10,
  "weather": {
    "provider": "open-meteo",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "locationName": "London",
    "units": "metric"
  },
  "videoWall": {
    "videos": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ]
  }
}
```

| Field | Default | Description |
|---|---|---|
| `defaultMode` | `"slideshow"` | Mode shown on first load: `slideshow`, `slideshow-weather`, or `video-wall` |
| `slideshowInterval` | `10` | Seconds between slide advances |
| `weather.provider` | `"open-meteo"` | `"open-meteo"` (free, no key) or `"openweathermap"` |
| `weather.apiKey` | `""` | Required only for `openweathermap` |
| `weather.latitude` / `longitude` | London | Coordinates for weather data |
| `weather.locationName` | `"London"` | Display name shown in the weather panel |
| `weather.units` | `"metric"` | `"metric"` (°C) or `"imperial"` (°F) |
| `videoWall.videos` | `[]` | YouTube URLs or video IDs |

### 4. Build

```bash
npm run build
```

This runs in order:
1. `build:manifest` — scans `photos/` and generates `src/generated/photo-manifest.ts`
2. `build:config` — reads `config.json` and generates `src/generated/app-config.ts`
3. `vite build` — bundles to `dist/`

> **Note:** Adding or removing photos requires a rebuild.

### 5. Serve

```bash
npm run preview
```

Or serve the `dist/` folder with any static file server:

```bash
npx serve dist
```

## Display Modes

Switch modes via URL hash:

| URL | Mode |
|---|---|
| `/#slideshow` | Photo slideshow |
| `/#slideshow-weather` | Slideshow with weather panel |
| `/#video-wall` | 4×4 YouTube video grid |

## Photo Layout

The slideshow uses intelligent layouts based on photo orientation:

- **Landscape** → fullscreen, edge-to-edge
- **Two consecutive portraits** → side-by-side, each 50% width
- **Portrait + two landscapes** → portrait left 50%, landscapes stacked right 50%

Photos are displayed in a looping shuffle (randomised, then reshuffled when all shown).

## Video Wall

- Up to 16 videos per page; use arrows to navigate pages
- All videos play muted by default
- Click any video to enter fullscreen and unmute
- Press Escape to return to the grid

## Development

```bash
npm run dev
```

Photos are served from `photos/` during dev. The build scripts must be run at least once to generate the type files in `src/generated/`.
