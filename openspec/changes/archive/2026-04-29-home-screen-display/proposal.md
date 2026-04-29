## Why

A static home screen display is needed to serve as an always-on ambient screen — showing photo slideshows, live weather, or a video wall depending on context. This solves the need for a low-maintenance, self-hosted display that compiles to static files and requires no server runtime.

## What Changes

- New TypeScript-based static site generator that compiles to plain HTML/CSS/JS
- Build-time photo discovery from a `photos/` folder for slideshow modes
- Build-time config parsing for weather API credentials, location, and YouTube URLs
- Three distinct display modes selectable at build time or via runtime toggle

## Capabilities

### New Capabilities

- `slideshow`: Photo slideshow with intelligent layout — fullscreen for landscape photos, tiled for portrait combinations (two portrait, or one portrait + two landscape)
- `slideshow-weather`: Slideshow variant with live weather overlay on the right — current conditions, hourly forecast vertically, and multi-day forecast row at the bottom; driven by a free-tier weather API (Open-Meteo or OpenWeatherMap)
- `video-wall`: 4×4 grid of embedded YouTube videos (paged), muted by default; clicking a video opens it fullscreen and unmuted; URLs read from config at build time

### Modified Capabilities

## Impact

- New project: no existing code affected
- Dependencies: TypeScript, a bundler (Vite or esbuild), YouTube iframe embed API, free-tier weather API (Open-Meteo — no key required, or OpenWeatherMap free tier)
- Output: fully static `dist/` folder — deployable to any static host or served locally
- Config file (`config.json` or `config.ts`) read at build time for weather API key, location coordinates, and YouTube URLs
- `photos/` folder scanned at build time; photo metadata (dimensions/orientation) embedded into the compiled output
