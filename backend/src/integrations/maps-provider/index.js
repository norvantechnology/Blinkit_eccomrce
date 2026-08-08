const env = require('../../config/env');
const { AppError } = require('../../utils/errors');
const logger = require('../../utils/logger');

const PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

/**
 * Google Places Autocomplete — requires MAPS_API_KEY with Places API enabled.
 * @param {string} query - Search text
 * @param {object} [options]
 * @param {string} [options.country] - ISO country code restriction (default: in)
 */
const searchAddresses = async (query, options = {}) => {
  const apiKey = env.mapsApiKey;

  if (!apiKey) {
    throw new AppError(
      'Maps API is not configured. Set MAPS_API_KEY in .env (Google Places API must be enabled).',
      503,
    );
  }

  const country = options.country || 'in';
  const params = new URLSearchParams({
    input: query,
    key: apiKey,
    components: `country:${country}`,
    types: 'address',
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

  if (autocompleteData.status !== 'OK' && autocompleteData.status !== 'ZERO_RESULTS') {
    throw new AppError(`Maps search failed: ${autocompleteData.status}`, 502);
  }

  const predictions = autocompleteData.predictions || [];

  const results = await Promise.all(
    predictions.slice(0, 5).map(async (prediction) => {
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

  return results;
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
