import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './ApiContext';
import type { ClubApi } from '@/api/client';

/** Everything under ['club'] is refetched after any registry change: the data is small. */
export const clubKeys = {
  all: ['club'] as const,
  seasons: ['club', 'seasons'] as const,
  season: (id: number) => ['club', 'season', id] as const,
  team: (id: number) => ['club', 'team', id] as const,
  people: (q: string) => ['club', 'people', q] as const,
  person: (id: number) => ['club', 'person', id] as const,
  coaches: (seasonId: number | null) => ['club', 'coaches', seasonId] as const,
  accounts: (q: string) => ['club', 'accounts', q] as const,
};

export function useClubQuery<T>(key: readonly unknown[], run: (club: ClubApi) => Promise<T>, enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: key, queryFn: () => run(api.club), enabled });
}

export function useClubMutation<TArgs, TResult = unknown>(run: (club: ClubApi, args: TArgs) => Promise<TResult>) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => run(api.club, args),
    onSuccess: () => qc.invalidateQueries({ queryKey: clubKeys.all }),
  });
}
