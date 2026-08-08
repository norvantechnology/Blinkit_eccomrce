/**
 * Stub OpenSearch client for local development.
 * In production, connects to AWS OpenSearch Service.
 */
const env = require('./env');

const search = {
  async search(_index, _query) {
    console.log(`[search] Stub search — OpenSearch not configured (${env.opensearchEndpoint})`);
    return { hits: { hits: [], total: { value: 0 } } };
  },

  async index(_index, _id, _document) {
    console.log('[search] Stub index — OpenSearch not configured');
    return { result: 'created' };
  },

  async delete(_index, _id) {
    console.log('[search] Stub delete — OpenSearch not configured');
    return { result: 'deleted' };
  },
};

module.exports = search;
