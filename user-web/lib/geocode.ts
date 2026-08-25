/** Lightweight OSM Nominatim helpers when MAPS_API_KEY search is unavailable. */

export type GeoSuggestion = {
  placeId: string;
  description: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

export async function searchPlaces(
  q: string,
  signal?: AbortSignal,
): Promise<GeoSuggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'in');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return rows.map((r) => ({
    placeId: String(r.place_id),
    description: r.display_name,
    fullAddress: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
