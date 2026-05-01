import type { PhotoMeta } from '../../generated/photo-manifest'
import type { WeatherConfig } from '../../services/weather'
import { fetchWeather, loadCache, weatherIcon, weatherDescription } from '../../services/weather'
import type { WeatherData } from '../../services/weather'
import { mountSlideshow } from '../slideshow/index'
import { dbg } from '../../utils/dbg'

const REFRESH_MS = 15 * 60 * 1000

function unitSymbol(units: string): string {
  return units === 'imperial' ? '°F' : '°C'
}

function renderCurrentWeather(data: WeatherData): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;flex-shrink:0;'

  const sym = unitSymbol(data.current.units)

  const loc = document.createElement('div')
  loc.textContent = data.locationName
  loc.style.cssText = 'font-size:1.1rem;font-weight:600;color:rgba(255,255,255,0.9);'
  el.appendChild(loc)

  const icon = document.createElement('span')
  icon.textContent = weatherIcon(data.current.code)
  icon.style.cssText = 'font-size:2.8rem;line-height:1;margin:4px 0;'
  el.appendChild(icon)

  const temp = document.createElement('div')
  temp.style.cssText = 'font-size:2.6rem;font-weight:700;line-height:1;'
  temp.textContent = `${data.current.temperature}${sym}`
  el.appendChild(temp)

  const wind = document.createElement('div')
  wind.style.cssText = 'font-size:0.95rem;color:rgba(255,255,255,0.75);margin-top:2px;'
  wind.textContent = `${data.current.windSpeed} km/h`
  el.appendChild(wind)

  const desc = document.createElement('div')
  desc.textContent = data.current.description
  desc.style.cssText = 'font-size:0.9rem;color:rgba(255,255,255,0.7);text-transform:capitalize;'
  el.appendChild(desc)

  const feels = document.createElement('div')
  feels.textContent = `Feels like ${data.current.feelsLike}${sym}`
  feels.style.cssText = 'font-size:0.8rem;color:rgba(255,255,255,0.45);'
  el.appendChild(feels)

  return el
}

function renderHourlyForecast(data: WeatherData): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;'

  const title = document.createElement('div')
  title.textContent = 'Hourly'
  title.style.cssText =
    'font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);margin-bottom:6px;'
  el.appendChild(title)

  const list = document.createElement('div')
  list.style.cssText = 'display:flex;flex-direction:column;justify-content:space-between;flex:1;overflow:hidden;padding:0 8px;'

  const sym = unitSymbol(data.current.units)
  for (const h of data.hourly.slice(0, 12)) {
    const row = document.createElement('div')
    row.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;font-size:0.85rem;'
    row.innerHTML = `
      <span style="color:rgba(255,255,255,0.6);min-width:52px;">${h.time}</span>
      <span style="font-size:1.1rem;">${weatherIcon(h.code)}</span>
      <span style="font-weight:500;min-width:38px;text-align:right;">${h.temperature}${sym}</span>
      <span style="color:rgba(255,255,255,0.5);min-width:48px;text-align:right;">${h.windSpeed} km/h</span>
    `
    list.appendChild(row)
  }

  el.appendChild(list)
  return el
}

function renderDailyForecast(data: WeatherData): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'display:flex;flex-direction:column;gap:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;'

  const title = document.createElement('div')
  title.textContent = '5-Day Forecast'
  title.style.cssText =
    'font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);margin-bottom:4px;'
  el.appendChild(title)

  const grid = document.createElement('div')
  grid.style.cssText = 'display:flex;justify-content:space-between;gap:4px;'

  const sym = unitSymbol(data.current.units)
  for (const d of data.daily.slice(0, 5)) {
    const col = document.createElement('div')
    col.style.cssText =
      'display:flex;flex-direction:column;align-items:center;gap:2px;font-size:0.8rem;flex:1;'
    col.innerHTML = `
      <span style="color:rgba(255,255,255,0.6);">${d.day}</span>
      <span style="font-size:1.2rem;">${weatherIcon(d.code)}</span>
      <span style="font-weight:600;">${d.high}${sym}</span>
      <span style="color:rgba(255,255,255,0.5);">${d.low}${sym}</span>
    `
    grid.appendChild(col)
  }

  el.appendChild(grid)
  return el
}

function renderErrorState(locationName: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'display:flex;flex-direction:column;gap:8px;'

  const loc = document.createElement('div')
  loc.textContent = locationName
  loc.style.cssText = 'font-size:1.1rem;font-weight:600;'
  el.appendChild(loc)

  const indicator = document.createElement('div')
  indicator.style.cssText =
    'display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.5);font-size:0.9rem;'
  indicator.innerHTML = `<span>📡</span><span>Weather unavailable</span>`
  el.appendChild(indicator)

  return el
}

function buildWeatherPanel(
  panelEl: HTMLElement,
  data: WeatherData | null,
  locationName: string,
): void {
  panelEl.innerHTML = ''
  panelEl.style.cssText = `
    width:30%;height:100%;flex-shrink:0;
    background:rgba(0,0,0,0.72);backdrop-filter:blur(12px);
    padding:20px 14px;
    display:flex;flex-direction:column;gap:14px;
    overflow:hidden;
    border-left:1px solid rgba(255,255,255,0.08);
    color:#fff;
  `

  if (!data) {
    panelEl.appendChild(renderErrorState(locationName))
    return
  }

  panelEl.appendChild(renderCurrentWeather(data))
  panelEl.appendChild(renderHourlyForecast(data))
  panelEl.appendChild(renderDailyForecast(data))
}

export function mountSlideshowWeather(
  container: HTMLElement,
  photoList: PhotoMeta[],
  opts: { interval: number; weather: WeatherConfig },
): () => void {
  container.style.display = 'flex'
  container.style.overflow = 'hidden'

  const slideshowContainer = document.createElement('div')
  slideshowContainer.style.cssText = 'width:70%;height:100%;position:relative;flex-shrink:0;'
  container.appendChild(slideshowContainer)

  const weatherPanel = document.createElement('div')
  container.appendChild(weatherPanel)

  const cleanupSlideshow = mountSlideshow(slideshowContainer, photoList, {
    interval: opts.interval,
  })

  // Show cached data immediately if available
  const cached = loadCache()
  dbg('weather panel: cache ' + (cached ? 'hit' : 'miss'))
  buildWeatherPanel(weatherPanel, cached, opts.weather.locationName)

  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let destroyed = false

  async function refresh(): Promise<void> {
    if (destroyed) return
    dbg('weather panel: refresh start')
    try {
      const data = await fetchWeather(opts.weather)
      if (!destroyed) {
        buildWeatherPanel(weatherPanel, data, opts.weather.locationName)
        dbg('weather panel: rendered')
      }
    } catch (err) {
      dbg('weather panel: refresh failed', err)
      if (!destroyed && !cached) {
        buildWeatherPanel(weatherPanel, null, opts.weather.locationName)
      }
    }
  }

  void refresh()
  refreshTimer = setInterval(() => void refresh(), REFRESH_MS)

  return () => {
    destroyed = true
    cleanupSlideshow()
    if (refreshTimer !== null) clearInterval(refreshTimer)
  }
}
