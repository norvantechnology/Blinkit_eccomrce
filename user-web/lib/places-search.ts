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

/**
 * Delivery location search: Google Places via backend when MAPS_API_KEY is set,
 * otherwise OpenStreetMap Nominatim (free fallback).
 */
export async function searchDeliveryPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const { data } = await apiClient.get('/places/search', { params: { q } });
    const results = (data.data?.results || []) as PlaceSuggestion[];
    if (results.length > 0) {
      return results.filter((s) => s.lat != null && s.lng != null);
    }
  } catch {
    /* fall through to OSM */
  }

  const osm = await searchPlaces(q);
  return osm.map(osmToPlace);
}
