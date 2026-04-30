import './style.css'
import { defaultMode, showModeSwitcher } from './generated/app-config'
import type { Mode } from './generated/app-config'
import { photos } from './generated/photo-manifest'
import { slideshowInterval, weather, videoIds } from './generated/app-config'
import { clearApp } from './utils/dom'
import { mountSlideshow } from './modes/slideshow/index'
import { mountSlideshowWeather } from './modes/slideshow-weather/index'
import { mountVideoWall } from './modes/video-wall/index'

let activeCleanup: (() => void) | null = null

const MODE_LABELS: Record<Mode, string> = {
  'slideshow': 'Slideshow',
  'slideshow-weather': 'Weather',
  'video-wall': 'Videos',
}
const MODES: Mode[] = ['slideshow', 'slideshow-weather', 'video-wall']

function parseHash(): Mode {
  const hash = window.location.hash.slice(1)
  if (hash === 'slideshow' || hash === 'slideshow-weather' || hash === 'video-wall') {
    return hash as Mode
  }
  return defaultMode
}

function renderMode(mode: Mode): void {
  activeCleanup?.()
  activeCleanup = null
  clearApp()

  updateSwitcher(mode)

  const app = document.getElementById('app')!
  const container = document.createElement('div')
  container.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;'
  app.appendChild(container)

  if (mode === 'slideshow') {
    activeCleanup = mountSlideshow(container, photos, { interval: slideshowInterval })
  } else if (mode === 'slideshow-weather') {
    activeCleanup = mountSlideshowWeather(container, photos, {
      interval: slideshowInterval,
      weather,
    })
  } else {
    activeCleanup = mountVideoWall(container, videoIds)
  }
}

// Mode switcher overlay

let switcherEl: HTMLElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function updateSwitcher(active: Mode): void {
  if (!switcherEl) return
  switcherEl.querySelectorAll('button').forEach((btn) => {
    const isActive = btn.dataset['mode'] === active
    btn.style.background = isActive ? 'rgba(255,255,255,0.25)' : 'transparent'
    btn.style.fontWeight = isActive ? '700' : '400'
  })
}

function mountSwitcher(): void {
  if (!showModeSwitcher) return

  const el = document.createElement('div')
  el.style.cssText = `
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    display:flex;gap:4px;
    background:rgba(0,0,0,0.55);backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,0.12);
    border-radius:32px;padding:6px 8px;
    z-index:1000;
    transition:opacity 0.3s;
  `
  el.style.opacity = '1'

  for (const mode of MODES) {
    const btn = document.createElement('button')
    btn.dataset['mode'] = mode
    btn.textContent = MODE_LABELS[mode]
    btn.style.cssText = `
      border:none;cursor:pointer;color:#fff;
      padding:6px 16px;border-radius:24px;
      font-size:0.85rem;transition:background 0.2s;
    `
    btn.addEventListener('click', () => {
      window.location.hash = mode
    })
    el.appendChild(btn)
  }

  document.body.appendChild(el)
  switcherEl = el

  // Auto-hide after 4 seconds, re-show on mouse move
  function resetHideTimer(): void {
    el.style.opacity = '1'
    if (hideTimer !== null) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      el.style.opacity = '0.15'
    }, 4000)
  }

  document.addEventListener('mousemove', resetHideTimer)
  document.addEventListener('touchstart', resetHideTimer)
  resetHideTimer()

  updateSwitcher(parseHash())
}

window.addEventListener('hashchange', () => renderMode(parseHash()))

mountSwitcher()
renderMode(parseHash())
