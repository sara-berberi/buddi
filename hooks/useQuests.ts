import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { VenueCategory } from '../types';

export const questKeys = {
  tonight: (category?: VenueCategory) => ['quests', 'tonight', category ?? 'all'] as const,
  forFriendship: (id: string) => ['quests', 'friendship', id] as const,
  venue: (id: string) => ['quests', 'venue', id] as const,
};

export function useTonightQuests(category?: VenueCategory) {
  return useQuery({
    queryKey: questKeys.tonight(category),
    queryFn: () => api.getQuests(category),
  });
}

export function useFriendshipQuests(id: string) {
  return useQuery({
    queryKey: questKeys.forFriendship(id),
    queryFn: () => api.getFriendshipQuests(id),
    enabled: Boolean(id),
  });
}

export function useVenueQuest(venueId: string) {
  return useQuery({
    queryKey: questKeys.venue(venueId),
    queryFn: () => api.getVenueQuest(venueId),
    enabled: Boolean(venueId),
  });
}
