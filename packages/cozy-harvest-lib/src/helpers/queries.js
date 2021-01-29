import CozyClient, { Q } from 'cozy-client'

const DEFAULT_CACHE_TIMEOUT_QUERIES = 1 * 60 * 1000
const defaultFetchPolicy = CozyClient.fetchPolicies.olderThan(
  DEFAULT_CACHE_TIMEOUT_QUERIES
)

export const buildKonnectorQuery = (slug, source) => {
  const query = {
    definition: () =>
      Q('io.cozy.konnectors').getById(`io.cozy.konnectors/${slug}`),
    options: {
      as: `konnector-${slug}-${source}`,
      fetchPolicy: defaultFetchPolicy
    }
  }
  const queryDef = query.definition()
  queryDef.sources = [source]

  return { definition: queryDef, options: query.options }
}
