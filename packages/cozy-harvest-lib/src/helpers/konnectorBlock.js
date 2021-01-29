import { generateUniversalLink } from 'cozy-ui/transpiled/react/AppLinker'

import { buildKonnectorQuery } from './queries'

const fetchAndFormatKonnector = async ({
  client,
  query,
  universalLink,
  iconStatus
}) => {
  try {
    await client.query(query.definition, query.options)
    const res = client.getQueryFromState(query.options.as)
    const { data } = res
    const konnector = data[0].attributes

    const link = generateUniversalLink({
      cozyUrl: client.getStackClient().uri,
      slug: universalLink.slug,
      subDomainType: client.getInstanceOptions().cozySubdomainType,
      nativePath: universalLink.nativePath
    })

    return {
      name: konnector.name,
      link,
      vendorLink: konnector.vendor_link && {
        component: 'a',
        href: konnector.vendor_link,
        target: '_blank'
      },
      iconStatus
    }
  } catch (error) {
    throw error
  }
}

export const fetchKonnectorFromStackOrRegistry = async ({
  client,
  slug,
  sourceAccount
}) => {
  try {
    return await fetchAndFormatKonnector({
      client,
      query: buildKonnectorQuery(slug, 'stack'),
      universalLink: {
        slug: 'home',
        nativePath: `connected/${slug}/accounts/${sourceAccount}`
      }
    })
  } catch (error) {
    // The konnector could be uninstalled
    if (error.status === 404) {
      try {
        return await fetchAndFormatKonnector({
          client,
          query: buildKonnectorQuery(slug, 'registry'),
          universalLink: {
            slug: 'store',
            nativePath: `discover/${slug}`
          },
          iconStatus: 'disabled'
        })
      } catch (error) {
        throw error
      }
    }
  }
}
