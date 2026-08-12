/**
 * Stub OpenSearch — enable later if product search needs it.
 */
const search = {
  async search(_index, _query) {
    console.log('[search] Stub — OpenSearch not configured');
    return { hits: { hits: [], total: { value: 0 } } };
  },

  async index(_index, _id, _document) {
    console.log('[search] Stub index');
    return { result: 'created' };
  },

  async delete(_index, _id) {
    console.log('[search] Stub delete');
    return { result: 'deleted' };
  },
};

module.exports = search;
