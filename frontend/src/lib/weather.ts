/** WMO weather codes (Open-Meteo) → icon name and Czech label. Pure. */
export type WeatherIcon = 'sun' | 'moon' | 'cloud-sun' | 'cloud' | 'cloud-fog' | 'cloud-drizzle' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning';

export function describeWeather(code: number, isDay: boolean): { icon: WeatherIcon; label: string } {
  if (code === 0) return { icon: isDay ? 'sun' : 'moon', label: 'Jasno' };
  if (code <= 2) return { icon: isDay ? 'cloud-sun' : 'cloud', label: 'Polojasno' };
  if (code === 3) return { icon: 'cloud', label: 'Zataženo' };
  if (code === 45 || code === 48) return { icon: 'cloud-fog', label: 'Mlha' };
  if (code >= 51 && code <= 57) return { icon: 'cloud-drizzle', label: 'Mrholení' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: 'cloud-rain', label: 'Déšť' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: 'cloud-snow', label: 'Sněžení' };
  if (code >= 95) return { icon: 'cloud-lightning', label: 'Bouřky' };
  return { icon: 'cloud', label: 'Oblačno' };
}

export function weatherUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code,is_day',
    daily: 'precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}
