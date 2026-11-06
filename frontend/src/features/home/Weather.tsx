import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useWeather } from '@/app/queries';
import { describeWeather, type WeatherIcon } from '@/lib/weather';

const ICONS: Record<WeatherIcon, LucideIcon> = {
  sun: Sun, moon: Moon, 'cloud-sun': CloudSun, cloud: Cloud, 'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle, 'cloud-rain': CloudRain, 'cloud-snow': CloudSnow, 'cloud-lightning': CloudLightning,
};

const number = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** Temperature now and today's chance of rain, like a pitch-side board. Hidden when not configured or offline. */
export function Weather({ place }: { place: { lat: number; lon: number } | null | undefined }) {
  const { data } = useWeather(place);
  if (!data) return null;
  const { icon, label } = describeWeather(data.code, data.isDay);
  const Icon = ICONS[icon];

  return (
    <div className="flex items-center gap-3" title={label}>
      <Icon className="h-9 w-9 text-accent" strokeWidth={2.25} aria-hidden="true" />
      <div className="tabular text-right font-bold leading-tight">
        <div className="border-b border-ink/60 pb-1">{number.format(data.temperature)} °C</div>
        {data.rainChance !== null && (
          <div className="pt-1 text-sm">
            <span className="sr-only">{label}, pravděpodobnost srážek </span>
            {data.rainChance} %
          </div>
        )}
      </div>
    </div>
  );
}
