import type { WeatherChatInput, WeatherChatResult, GeocodingResult, ForecastData } from './types';

const BASE_URL = import.meta.env.BASE_URL || '/';
const API_PREFIX = `${BASE_URL.replace(/\/$/, '')}/api`;

export async function chat(input: WeatherChatInput): Promise<WeatherChatResult> {
  const res = await fetch(`${API_PREFIX}/weather/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat API error: ${res.status}`);
  }
  
  return await res.json();
}

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return (data.results || []).filter((r: GeocodingResult) => r.country_code === 'US');
}

export async function getForecast(lat: number, lon: number): Promise<ForecastData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch'
  });
  
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Forecast failed');
  return await res.json();
}

export async function getCitiesCurrentWeather(lats: number[], lons: number[]) {
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lons.join(','),
    current: 'temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover',
    timezone: 'auto',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph'
  });
  
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Cities weather failed');
  return await res.json();
}

export async function getRainViewerRadar() {
  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
  if (!res.ok) throw new Error('RainViewer metadata failed');
  return await res.json();
}
