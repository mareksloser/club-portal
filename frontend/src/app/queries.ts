import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './ApiContext';
import type { ApiClient } from '@/api/client';
import { weatherUrl } from '@/lib/weather';

export const keys = {
  config: ['config'] as const,
  dashboard: ['dashboard'] as const,
  directory: ['directory'] as const,
};

export function useConfig() {
  const api = useApi();
  return useQuery({ queryKey: keys.config, queryFn: () => api.config(), staleTime: Infinity });
}

/** Refreshed when the user comes back to the tab: links and permissions can change at any time. */
export function useDashboard() {
  const api = useApi();
  return useQuery({ queryKey: keys.dashboard, queryFn: () => api.dashboard(), staleTime: 60_000, refetchOnWindowFocus: true });
}

/** Teams and roles for the access-rule editor; loaded only in edit mode. */
export function useDirectory(enabled: boolean) {
  const api = useApi();
  return useQuery({ queryKey: keys.directory, queryFn: () => api.directory(), enabled, staleTime: 5 * 60_000 });
}

export function useSignIn() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (options: { returnTo?: string }) => api.signIn(options),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.dashboard }), // the demo signs in without a redirect
  });
}

export function useLogout() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

/** Any edit-mode change; the dashboard is reloaded afterwards. */
export function useEdit<TArgs>(run: (api: ApiClient, args: TArgs) => Promise<unknown>) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => run(api, args),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export interface Weather {
  temperature: number;
  code: number;
  isDay: boolean;
  rainChance: number | null;
}

/** Current weather from Open-Meteo (no API key), refreshed every 15 minutes. */
export function useWeather(place: { lat: number; lon: number } | null | undefined) {
  return useQuery({
    queryKey: ['weather', place?.lat, place?.lon],
    enabled: !!place,
    staleTime: 15 * 60_000,
    refetchInterval: 15 * 60_000,
    queryFn: async (): Promise<Weather> => {
      const res = await fetch(weatherUrl(place!.lat, place!.lon));
      if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
      const data = await res.json();
      return {
        temperature: data.current.temperature_2m,
        code: data.current.weather_code,
        isDay: data.current.is_day === 1,
        rainChance: data.daily?.precipitation_probability_max?.[0] ?? null,
      };
    },
  });
}
