// Weather data service.
// -----------------------------------------------------------------------------
// CURRENT: returns mock Belfast weather.
// FUTURE:  call a weather API (e.g. Open-Meteo needs no key; OpenWeather needs one
//          via an env var + ideally a backend proxy). Map the response into the
//          same { location, current, suggestion, forecast[] } shape.
// -----------------------------------------------------------------------------
import { mockWeather } from '../data/mockData'
import { delay, maybeFail } from './_helpers'

export const meta = { key: 'weather', name: 'Weather', source: 'mock' }

export async function getWeather({ location = 'Belfast', failRate = 0 } = {}) {
  await delay(350)
  maybeFail(failRate)
  return { ...mockWeather, location }
}
