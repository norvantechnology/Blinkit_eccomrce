const env = require('../../config/env');
const { AppError } = require('../../utils/errors');
const logger = require('../../utils/logger');

const PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

/** Default bias: Bangalore (Blinkit-style single store) */
const DEFAULT_BIAS = { lat: 12.9352, lng: 77.6245 };

/**
 * Google Places Autocomplete — requires MAPS_API_KEY with Places API enabled.
 * Uses geocode type for area/street search (Blinkit “search delivery location”).
 */
const searchAddresses = async (query, options = {}) => {
  const apiKey = env.mapsApiKey;

  if (!apiKey) {
    throw new AppError(
      'Maps API is not configured. Set MAPS_API_KEY (Google Places API must be enabled).',
      503,
    );
  }

  const country = options.country || 'in';
  const bias = options.bias || DEFAULT_BIAS;
  const params = new URLSearchParams({
    input: query,
    key: apiKey,
    components: `country:${country}`,
    types: 'geocode',
    location: `${bias.lat},${bias.lng}`,
    radius: '50000',
    language: options.language || 'en',
  });

  const autocompleteRes = await fetch(`${PLACES_AUTOCOMPLETE_URL}?${params}`);
  const autocompleteData = await autocompleteRes.json();

  if (autocompleteData.status === 'REQUEST_DENIED') {
    logger.error('Google Places API denied', { error: autocompleteData.error_message });
    throw new AppError(
      autocompleteData.error_message || 'Maps API request denied. Check MAPS_API_KEY.',
      502,
    );
  }

  if (autocompleteData.status === 'ZERO_RESULTS') {
    return [];
  }

  if (autocompleteData.status !== 'OK') {
    throw new AppError(`Maps search failed: ${autocompleteData.status}`, 502);
  }

  const predictions = autocompleteData.predictions || [];

  const results = await Promise.all(
    predictions.slice(0, 6).map(async (prediction) => {
      const details = await fetchPlaceDetails(prediction.place_id, apiKey);
      return {
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
        fullAddress: details?.formattedAddress || prediction.description,
        lat: details?.lat ?? null,
        lng: details?.lng ?? null,
      };
    }),
  );

  return results.filter((r) => r.lat != null && r.lng != null);
};

const fetchPlaceDetails = async (placeId, apiKey) => {
  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: 'formatted_address,geometry',
  });

  const res = await fetch(`${PLACE_DETAILS_URL}?${params}`);
  const data = await res.json();

  if (data.status !== 'OK' || !data.result) {
    return null;
  }

  return {
    formattedAddress: data.result.formatted_address,
    lat: data.result.geometry?.location?.lat,
    lng: data.result.geometry?.location?.lng,
  };
};

module.exports = { searchAddresses };
