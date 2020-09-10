import React, { useState } from 'react'
import PropTypes from 'prop-types'
import startCase from 'lodash/startCase'
import compose from 'lodash/flowRight'

import CozyClient, { Q, queryConnect } from 'cozy-client'
import Icon from 'cozy-ui/transpiled/react/Icon'

import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import NavigationList, {
  NavigationListSection,
  NavigationListHeader
} from 'cozy-ui/transpiled/react/NavigationList'

import { getAccountLabel } from './bankAccountHelpers'
import EditContract from './EditContract'

import withLocales from '../../hoc/withLocales'

const makeContractsConn = ({ account }) => {
  const doctype = 'io.cozy.bank.accounts'
  return {
    query: () =>
      Q(doctype).where({ 'relationships.connection.data._id': account._id }),
    as: `connection-${account._id}/contracts`,
    fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000)
  }
}

const getPrimaryTextPerDoctype = {
  'io.cozy.bank.accounts': getAccountLabel
}

const getPrimaryTextDefault = contract => contract.label

const ContractItem = ({ contract }) => {
  const [showingEditModal, setShowingEditModal] = useState(false)
  const getPrimaryText =
    getPrimaryTextPerDoctype[contract._type] || getPrimaryTextDefault
  const { t } = useI18n()
  return (
    <>
      <ListItem
        className="u-c-pointer"
        onClick={() => {
          setShowingEditModal(true)
        }}
      >
        <ListItemIcon>
          <Icon icon="wallet" className="u-slateGrey" />
        </ListItemIcon>
        <ListItemText
          primaryText={startCase(getPrimaryText(contract).toLowerCase())}
          secondaryText={contract._deleted ? t('contracts.deleted') : null}
        />
        <ListItemSecondaryAction>
          <Icon icon="right" className="u-coolGrey u-mr-1" />
        </ListItemSecondaryAction>
      </ListItem>
      {showingEditModal ? (
        <EditContract
          contract={contract}
          dismissAction={() => {
            setShowingEditModal(false)
          }}
          onSuccess={() => {
            setShowingEditModal(false)
          }}
          onCancel={() => {
            setShowingEditModal(false)
          }}
          onAfterRemove={() => {
            setShowingEditModal(false)
          }}
        />
      ) : null}
    </>
  )
}

const customHeaderPerDoctype = {
  'io.cozy.bank.accounts': 'bankAccounts'
}

const DumbContracts = ({ contracts }) => {
  const contractData = contracts.data ? contracts.data : contracts
  const { t } = useI18n()
  const doctype = contractData[0] ? contractData[0]._type : null
  const headerKey = customHeaderPerDoctype[doctype] || 'default'
  return contractData.length > 0 ? (
    <MuiCozyTheme>
      <NavigationList>
        <NavigationListHeader>
          {t(`contracts.headers.${headerKey}`)}
        </NavigationListHeader>
        <NavigationListSection>
          {contractData &&
            contractData.map(contract => {
              return <ContractItem key={contract._id} contract={contract} />
            })}
        </NavigationListSection>
      </NavigationList>
    </MuiCozyTheme>
  ) : null
}

const CollectionPropType = PropTypes.shape({
  fetchStatus: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired
})

DumbContracts.propTypes = {
  contracts: PropTypes.oneOfType([CollectionPropType, PropTypes.array])
}

export const ContractsForAccount = compose(
  withLocales,
  queryConnect({
    contracts: makeContractsConn
  })
)(DumbContracts)

export const Contracts = withLocales(DumbContracts)
