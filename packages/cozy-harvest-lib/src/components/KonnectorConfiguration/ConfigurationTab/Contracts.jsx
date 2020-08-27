import React, { useState } from 'react'
import startCase from 'lodash/startCase'
import compose from 'lodash/flowRight'

import CozyClient, { Q, queryConnect } from 'cozy-client'
import Icon from 'cozy-ui/transpiled/react/Icon'

import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import DialogCloseButton from 'cozy-ui/transpiled/react/MuiCozyTheme/Dialog/DialogCloseButton'

import { getAccountLabel } from './bankAccountHelpers'
import EditContractModal from './EditContract'

import withLocales from '../../hoc/withLocales'

const makeContractsConn = ({ account }) => {
  // TODO make it in function of the konnector
  const doctype = 'io.cozy.bank.accounts'
  return {
    query: () =>
      Q(doctype).where({ 'relationships.connection.data._id': account._id }),
    as: `connection-${account._id}/contracts`,
    fetchPolicy: CozyClient.fetchPolicies.olderThan(60 * 1000)
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
        />
        <ListItemSecondaryAction>
          <Icon icon="right" className="u-coolGrey u-mr-1" />
        </ListItemSecondaryAction>
      </ListItem>
      {showingEditModal ? (
        <EditContractModal
          contract={contract}
          dismissAction={() => {
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

const DumbContracts = ({ contracts, doctype }) => {
  const { t } = useI18n()
  const headerKey = customHeaderPerDoctype[doctype] || 'default'
  return contracts.data.length > 0 ? (
    <MuiCozyTheme>
      <ListSubheader>{t(`contracts.headers.${headerKey}`)}</ListSubheader>
      <List dense>
        {contracts &&
          contracts.data &&
          contracts.data.map(contract => {
            return <ContractItem key={contract._id} contract={contract} />
          })}
      </List>
    </MuiCozyTheme>
  ) : null
}

export default compose(
  withLocales,
  queryConnect({
    contracts: props => makeContractsConn(props)
  })
)(DumbContracts)
