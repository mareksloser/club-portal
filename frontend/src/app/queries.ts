import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './ApiContext';

export const keys = {
  config: ['config'] as const,
  dashboard: ['dashboard'] as const,
};

export function useConfig() {
  const api = useApi();
  return useQuery({ queryKey: keys.config, queryFn: () => api.config(), staleTime: Infinity });
}

/** Apps can be granted at any time, so the list is refreshed when the user comes back to the tab. */
export function useDashboard() {
  const api = useApi();
  return useQuery({ queryKey: keys.dashboard, queryFn: () => api.dashboard(), staleTime: 60_000, refetchOnWindowFocus: true });
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
    onSuccess: () => qc.setQueryData(keys.dashboard, null),
  });
}
