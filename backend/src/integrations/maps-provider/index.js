const env = require('../../config/env');
const { AppError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/** Places API (New) - legacy Place Autocomplete is disabled on new Google Cloud projects. */
const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const placeDetailsUrl = (placeId) =>
  `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

/** Default bias: Bangalore (Blinkit-style single store) */
const DEFAULT_BIAS = { lat: 12.9352, lng: 77.6245 };

/**
 * Google Places Autocomplete (New) - requires MAPS_API_KEY with Places API (New) enabled.
 */
const searchAddresses = async (query, options = {}) => {
  const apiKey = env.mapsApiKey;

  if (!apiKey) {
    throw new AppError(
      'Maps API is not configured. Set MAPS_API_KEY (Places API New must be enabled).',
      503,
    );
  }

  const country = (options.country || 'in').toLowerCase();
  const bias = options.bias || DEFAULT_BIAS;

  const body = {
    input: query,
    includedRegionCodes: [country],
    locationBias: {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: 50000.0,
      },
    },
    languageCode: options.language || 'en',
  };

  let autocompleteData;
  try {
    const autocompleteRes = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify(body),
    });
    autocompleteData = await autocompleteRes.json();

    if (!autocompleteRes.ok) {
      const msg =
        autocompleteData?.error?.message ||
        autocompleteData?.message ||
        `HTTP ${autocompleteRes.status}`;
      logger.error('Google Places API (New) denied', { error: msg });
      throw new AppError(msg || 'Maps API request denied. Check MAPS_API_KEY.', 502);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Google Places autocomplete failed', { error: err.message });
    throw new AppError('Maps search failed', 502);
  }

  const suggestions = autocompleteData.suggestions || [];
  if (suggestions.length === 0) {
    return [];
  }

  const results = await Promise.all(
    suggestions.slice(0, 6).map(async (suggestion) => {
      const prediction = suggestion.placePrediction;
      if (!prediction?.placeId) return null;

      const mainText =
        prediction.structuredFormat?.mainText?.text ||
        prediction.text?.text ||
        '';
      const secondaryText = prediction.structuredFormat?.secondaryText?.text || '';
      const description = prediction.text?.text || mainText;

      const details = await fetchPlaceDetails(prediction.placeId, apiKey);
      return {
        placeId: prediction.placeId,
        description,
        mainText: mainText || description,
        secondaryText,
        fullAddress: details?.formattedAddress || description,
        lat: details?.lat ?? null,
        lng: details?.lng ?? null,
      };
    }),
  );

  return results.filter((r) => r && r.lat != null && r.lng != null);
};

const fetchPlaceDetails = async (placeId, apiKey) => {
  const id = String(placeId).replace(/^places\//, '');
  const res = await fetch(placeDetailsUrl(id), {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,formattedAddress,location,displayName',
    },
  });
  const data = await res.json();

  if (!res.ok || !data.location) {
    return null;
  }

  return {
    formattedAddress: data.formattedAddress || data.displayName?.text || '',
    lat: data.location.latitude,
    lng: data.location.longitude,
  };
};

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REVERSE_CACHE_MAX = 500;
const REVERSE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const reverseCache = new Map();
const GOOGLE_DENIED_BACKOFF_MS = 60 * 60 * 1000;
let googleReverseDeniedAt = 0;

const reverseViaGoogle = async (lat, lng, apiKey) => {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('language', 'en');
  url.searchParams.set('region', 'in');
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) {
    if (data.status === 'REQUEST_DENIED') googleReverseDeniedAt = Date.now();
    if (data.status !== 'ZERO_RESULTS') {
      logger.warn('Google reverse geocode unavailable', {
        status: data.status,
        error: data.error_message,
      });
    }
    return null;
  }
  // Skip plus-code-only results ("7JFJ+2X Surat") when a street address exists.
  const best =
    data.results.find((r) => !(r.types || []).includes('plus_code')) || data.results[0];
  return best.formatted_address || null;
};

const reverseViaNominatim = async (lat, lng) => {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '0');
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'TapiGrocery/1.0 (address reverse geocoding)',
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.display_name || null;
};

/** Coordinates → readable address. Google Geocoding when MAPS_API_KEY allows it, else OSM Nominatim. */
const reverseGeocode = async (lat, lng) => {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = reverseCache.get(key);
  if (hit && Date.now() - hit.at < REVERSE_CACHE_TTL_MS) return hit.value;

  let fullAddress = null;
  let source = null;
  const googleBackedOff = Date.now() - googleReverseDeniedAt < GOOGLE_DENIED_BACKOFF_MS;
  if (env.mapsApiKey && !googleBackedOff) {
    try {
      fullAddress = await reverseViaGoogle(lat, lng, env.mapsApiKey);
      if (fullAddress) source = 'google';
    } catch (err) {
      logger.warn('Google reverse geocode failed', { error: err.message });
    }
  }
  if (!fullAddress) {
    try {
      fullAddress = await reverseViaNominatim(lat, lng);
      if (fullAddress) source = 'osm';
    } catch (err) {
      logger.warn('Nominatim reverse geocode failed', { error: err.message });
    }
  }
  if (!fullAddress) throw new AppError('Could not find an address for this location', 502);

  const value = { fullAddress, source };
  if (reverseCache.size >= REVERSE_CACHE_MAX) {
    reverseCache.delete(reverseCache.keys().next().value);
  }
  reverseCache.set(key, { value, at: Date.now() });
  return value;
};

module.exports = { searchAddresses, reverseGeocode };
