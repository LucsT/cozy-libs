import React from 'react'
import PropTypes from 'prop-types'
import { Title } from 'cozy-ui/transpiled/react/Text'

import List from 'cozy-ui/transpiled/react/MuiCozyTheme/RaisedList'

import withLocales from '../hoc/withLocales'
import CiphersListItem from './CiphersListItem'
import OtherAccountListItem from './OtherAccountListItem'

export const DumbVaultCiphersList = ({ konnector, onSelect, ciphers, t }) => {
  const activeCiphers = ciphers.filter(cipherView => !cipherView.deletedDate)
  return (
    <>
      <Title className="u-ta-center u-mb-2">
        {t('vaultCiphersList.title')}
      </Title>
      <List>
        {activeCiphers.map(cipherView => (
          <CiphersListItem
            key={cipherView.id}
            cipherView={cipherView}
            konnector={konnector}
            onClick={() => onSelect(cipherView)}
          />
        ))}

        <OtherAccountListItem onClick={() => onSelect(null)} />
      </List>
    </>
  )
}

DumbVaultCiphersList.propTypes = {
  konnector: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

const VaultCiphersList = withLocales(DumbVaultCiphersList)

export default VaultCiphersList
