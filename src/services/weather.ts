import type { Units, WeatherProvider } from '../generated/app-config'

export interface WeatherData {
  locationName: string
  current: {
    temperature: number
    feelsLike: number
    windSpeed: number
    description: string
    code: number
    units: Units
  }
  hourly: Array<{ time: string; temperature: number; windSpeed: number; code: number }>
  daily: Array<{ day: string; high: number; low: number; code: number }>
}

const CACHE_KEY = 'home-screen:weather-cache-v5'

// WMO weather interpretation codes → emoji
const WMO_ICONS: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  56: '🌨️',
  57: '🌨️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  66: '🌨️',
  67: '🌨️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  77: '❄️',
  80: '🌦️',
  81: '🌦️',
  82: '🌦️',
  85: '🌨️',
  86: '🌨️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Thunderstorm w/ hail',
}

export function weatherIcon(code: number): string {
  return WMO_ICONS[code] ?? '🌡️'
}

export function weatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown'
}

const OWM_ICONS: Record<number, string> = {
  200: '⛈️', 201: '⛈️', 202: '⛈️', 210: '⛈️', 211: '⛈️',
  212: '⛈️', 221: '⛈️', 230: '⛈️', 231: '⛈️', 232: '⛈️',
  300: '🌦️', 301: '🌦️', 302: '🌦️', 310: '🌦️', 311: '🌦️',
  312: '🌦️', 313: '🌦️', 314: '🌦️', 321: '🌦️',
  500: '🌧️', 501: '🌧️', 502: '🌧️', 503: '🌧️', 504: '🌧️',
  511: '🌨️', 520: '🌦️', 521: '🌦️', 522: '🌦️', 531: '🌦️',
  600: '❄️', 601: '❄️', 602: '❄️', 611: '🌨️', 612: '🌨️',
  613: '🌨️', 615: '🌨️', 616: '🌨️', 620: '🌨️', 621: '🌨️', 622: '🌨️',
  701: '🌫️', 711: '🌫️', 721: '🌫️', 731: '🌫️', 741: '🌫️',
  751: '🌫️', 761: '🌫️', 762: '🌫️', 771: '🌫️', 781: '🌪️',
  800: '☀️',
  801: '🌤️', 802: '⛅', 803: '☁️', 804: '☁️',
}

async function fetchOpenMeteo(
  lat: number,
  lon: number,
  units: Units,
  locationName: string,
): Promise<WeatherData> {
  const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius'
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&hourly=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto&forecast_days=6&temperature_unit=${tempUnit}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const data = (await res.json()) as {
    current: {
      time: string
      temperature_2m: number
      apparent_temperature: number
      weather_code: number
      wind_speed_10m: number
    }
    hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; wind_speed_10m: number[] }
    daily: {
      time: string[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      weather_code: number[]
    }
  }

  // Find the current hour index in the hourly array
  const currentHour = data.current.time.slice(0, 13) // "YYYY-MM-DDTHH"
  const startIdx = Math.max(
    0,
    data.hourly.time.findIndex((t) => t.startsWith(currentHour)),
  )

  const hourly = data.hourly.time.slice(startIdx, startIdx + 12).map((t, i) => ({
    time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    temperature: Math.round(data.hourly.temperature_2m[startIdx + i]!),
    windSpeed: Math.round(data.hourly.wind_speed_10m[startIdx + i]!),
    code: data.hourly.weather_code[startIdx + i]!,
  }))

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daily = data.daily.time.slice(0, 5).map((t, i) => ({
    day: DAYS[new Date(t + 'T12:00:00').getDay()]!,
    high: Math.round(data.daily.temperature_2m_max[i]!),
    low: Math.round(data.daily.temperature_2m_min[i]!),
    code: data.daily.weather_code[i]!,
  }))

  return {
    locationName,
    current: {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      windSpeed: Math.round(data.current.wind_speed_10m),
      description: weatherDescription(data.current.weather_code),
      code: data.current.weather_code,
      units,
    },
    hourly,
    daily,
  }
}

async function fetchOpenWeatherMap(
  lat: number,
  lon: number,
  apiKey: string,
  units: Units,
  locationName: string,
): Promise<WeatherData> {
  const owmUnits = units === 'imperial' ? 'imperial' : 'metric'
  const [curRes, fcRes] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${owmUnits}`,
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${owmUnits}&cnt=16`,
    ),
  ])

  if (!curRes.ok) throw new Error(`OWM ${curRes.status}`)
  if (!fcRes.ok) throw new Error(`OWM forecast ${fcRes.status}`)

  const cur = (await curRes.json()) as {
    main: { temp: number; feels_like: number }
    weather: Array<{ id: number; description: string }>
    wind: { speed: number }
  }
  const fc = (await fcRes.json()) as {
    list: Array<{
      dt: number
      main: { temp: number; temp_max: number; temp_min: number }
      weather: Array<{ id: number; description: string }>
    }>
  }

  const curCode = cur.weather[0]?.id ?? 800
  const hourly = fc.list.slice(0, 12).map((entry) => {
    const code = entry.weather[0]?.id ?? 800
    return {
      time: new Date(entry.dt * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temperature: Math.round(entry.main.temp),
      code,
    }
  })

  // Group forecast into daily buckets
  const dailyMap = new Map<string, { high: number; low: number; codes: number[] }>()
  for (const entry of fc.list) {
    const day = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })
    const existing = dailyMap.get(day)
    const code = entry.weather[0]?.id ?? 800
    if (existing) {
      existing.high = Math.max(existing.high, Math.round(entry.main.temp_max))
      existing.low = Math.min(existing.low, Math.round(entry.main.temp_min))
      existing.codes.push(code)
    } else {
      dailyMap.set(day, {
        high: Math.round(entry.main.temp_max),
        low: Math.round(entry.main.temp_min),
        codes: [code],
      })
    }
  }

  const daily = [...dailyMap.entries()].slice(0, 5).map(([day, d]) => ({
    day,
    high: d.high,
    low: d.low,
    code: d.codes[0]!,
  }))

  return {
    locationName,
    current: {
      temperature: Math.round(cur.main.temp),
      feelsLike: Math.round(cur.main.feels_like),
      windSpeed: Math.round(cur.wind.speed),
      description: cur.weather[0]?.description ?? '',
      code: curCode,
      units,
    },
    hourly,
    daily,
  }
}

function loadCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as WeatherData) : null
  } catch {
    return null
  }
}

function saveCache(data: WeatherData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

export interface WeatherConfig {
  provider: WeatherProvider
  apiKey: string
  latitude: number
  longitude: number
  locationName: string
  units: Units
}

export async function fetchWeather(cfg: WeatherConfig): Promise<WeatherData> {
  try {
    let data: WeatherData
    if (cfg.provider === 'openweathermap') {
      data = await fetchOpenWeatherMap(
        cfg.latitude,
        cfg.longitude,
        cfg.apiKey,
        cfg.units,
        cfg.locationName,
      )
    } else {
      data = await fetchOpenMeteo(cfg.latitude, cfg.longitude, cfg.units, cfg.locationName)
    }
    saveCache(data)
    return data
  } catch {
    const cached = loadCache()
    if (cached) return cached
    throw new Error('Weather unavailable and no cache')
  }
}

export { loadCache }
