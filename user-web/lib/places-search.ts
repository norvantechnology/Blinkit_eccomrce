import apiClient from '@/lib/api-client';
import { searchPlaces, type GeoSuggestion } from '@/lib/geocode';
import type { PlaceSuggestion } from '@/services/addresses.service';

function osmToPlace(s: GeoSuggestion): PlaceSuggestion {
  return {
    placeId: s.placeId,
    description: s.description,
    mainText: s.description.split(',')[0] || s.description,
    secondaryText: s.description,
    fullAddress: s.fullAddress,
    lat: s.lat,
    lng: s.lng,
  };
}

export type PlacesSearchOptions = {
  signal?: AbortSignal;
};

/**
 * Delivery location search: Google Places via backend when MAPS_API_KEY is set,
 * otherwise OpenStreetMap Nominatim (free fallback).
 */
export async function searchDeliveryPlaces(
  query: string,
  options: PlacesSearchOptions = {},
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const { data } = await apiClient.get('/places/search', {
      params: { q },
      signal: options.signal,
    });
    if (options.signal?.aborted) return [];
    const results = (data.data?.results || []) as PlaceSuggestion[];
    if (results.length > 0) {
      return results.filter((s) => s.lat != null && s.lng != null);
    }
  } catch (err) {
    if (options.signal?.aborted) return [];
    if ((err as { name?: string })?.name === 'CanceledError') return [];
    if ((err as { code?: string })?.code === 'ERR_CANCELED') return [];
    /* fall through to OSM */
  }

  if (options.signal?.aborted) return [];
  const osm = await searchPlaces(q, options.signal);
  if (options.signal?.aborted) return [];
  return osm.map(osmToPlace);
}
