// LIVE weather service — Open-Meteo (no API key, no backend, browser-friendly CORS).
// Fetches real current conditions + hourly forecast and maps them into the SAME shape
// the UI expects: { location, current, suggestion, forecast[] }.

export const meta = { key: 'weather', name: 'Weather', source: 'live' }

// WMO weather-code → human label. https://open-meteo.com/en/docs
const WMO = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy',
  45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}
const label = (code) => WMO[code] ?? 'Unknown'

async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const data = await res.json()
  const hit = data.results?.[0]
  if (!hit) throw new Error(`Couldn't find location: ${name}`)
  return { lat: hit.latitude, lon: hit.longitude, name: hit.name }
}

function currentHourIndex(times) {
  const now = Date.now()
  let best = 0, bestDiff = Infinity
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  })
  return best
}

function practicalSuggestion(current, hours) {
  const maxRain = Math.max(current.rainProbability, ...hours.slice(0, 6).map(h => h.rain))
  if (maxRain >= 60) return `Rain likely today (${maxRain}% chance) — take a jacket.`
  if (current.tempC <= 3) return 'Cold out — wrap up warm before you head off.'
  if (current.tempC >= 22) return 'Warm and dry — good day to be outside.'
  return 'Mixed conditions — nothing to plan around.'
}

export async function getWeather({ location = 'Belfast' } = {}) {
  const { lat, lon, name } = await geocode(location)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`
    + `&hourly=temperature_2m,precipitation_probability,weather_code`
    + `&timezone=auto&forecast_days=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`)
  const d = await res.json()

  const nowIdx = currentHourIndex(d.hourly.time)
  const c = d.current
  const current = {
    tempC: Math.round(c.temperature_2m),
    feelsLikeC: Math.round(c.apparent_temperature),
    condition: label(c.weather_code),
    windKph: Math.round(c.wind_speed_10m),
    rainProbability: d.hourly.precipitation_probability?.[nowIdx] ?? 0,
  }

  const forecast = []
  for (let i = 0; i < 5; i++) {
    const idx = Math.min(nowIdx + i * 3, d.hourly.time.length - 1)
    forecast.push({
      label: i === 0 ? 'Now' : new Date(d.hourly.time[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      tempC: Math.round(d.hourly.temperature_2m[idx]),
      condition: label(d.hourly.weather_code[idx]),
      rain: d.hourly.precipitation_probability?.[idx] ?? 0,
    })
  }

  return { location: name, current, suggestion: practicalSuggestion(current, forecast), forecast }
}