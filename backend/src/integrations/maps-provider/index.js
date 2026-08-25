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

module.exports = { searchAddresses };
