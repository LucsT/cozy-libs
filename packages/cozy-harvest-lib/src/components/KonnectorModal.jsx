import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { withClient } from 'cozy-client'
import AppIcon from 'cozy-ui/transpiled/react/AppIcon'
import Button from 'cozy-ui/transpiled/react/Button'
import Infos from 'cozy-ui/transpiled/react/Infos'
import Modal, {
  ModalContent,
  ModalHeader
} from 'cozy-ui/transpiled/react/Modal'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import get from 'lodash/get'

import { fetchTrigger } from '../connections/triggers'
import { fetchAccount } from '../connections/accounts'
import * as konnectorsModel from '../helpers/konnectors'
import * as triggersModel from '../helpers/triggers'

import TriggerManager from './TriggerManager'
import AccountSelectBox from './AccountSelectBox/AccountSelectBox'
import AccountsList from './AccountsList/AccountsList'
import KonnectorUpdateInfos from './infos/KonnectorUpdateInfos'
import KonnectorAccountTabs from './KonnectorConfiguration/KonnectorAccountTabs'

/**
 * KonnectorModal can be completely standalone and will use it's internal
 * state to switch between views, or it can be controlled by the parents
 * through props (such as accountId) and callbacks (such as createAction
 * and onAccountChange)
 */
export class KonnectorModal extends PureComponent {
  state = {
    account: null,
    fetching: false,
    fetchingAccounts: false,
    addingAccount: false,
    trigger: null,
    error: null,
    accountsAndTriggers: []
  }

  constructor(props) {
    super(props)
    this.fetchIcon = this.fetchIcon.bind(this)
    this.refetchTrigger = this.refetchTrigger.bind(this)
    this.requestAccountChange = this.requestAccountChange.bind(this)
    this.requestAccountCreation = this.requestAccountCreation.bind(this)
    this.endAccountCreation = this.endAccountCreation.bind(this)
  }
  /**
   * TODO We should not fetchAccounts and fetchAccount since we already have the informations
   * in the props. We kept this sytem for compatibility on the existing override.
   * Next tasks: remove these methods and rewrite the override
   */
  async componentDidMount() {
    await this.fetchAccounts()
    const { accountsAndTriggers } = this.state

    if (this.props.accountId) this.loadSelectedAccountId()
    else if (accountsAndTriggers.length === 1) {
      const { account, trigger } = accountsAndTriggers[0]
      this.requestAccountChange(account, trigger)
    }
  }

  componentWillUnmount() {
    const { into } = this.props
    if (!into || into === 'body') return
    // The Modal is never closed after a dismiss on Preact apps, even if it is
    // not rendered anymore. The best hack we found is to explicitly empty the
    // modal portal container.
    setTimeout(() => {
      try {
        const modalRoot = document.querySelector(into)
        modalRoot.innerHTML = ''
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }, 50)
  }

  componentDidUpdate(prevProps) {
    if (this.props.accountId && this.props.accountId !== prevProps.accountId) {
      this.loadSelectedAccountId()
    }
  }

  requestAccountChange(account, trigger) {
    // This component can either defer the account switching to a parent component through the onAccountChange prop, or handle the change itself if the prop is missing
    const { onAccountChange } = this.props
    return onAccountChange
      ? onAccountChange(account)
      : this.fetchAccount(trigger)
  }

  loadSelectedAccountId() {
    const selectedAccountId = this.props.accountId
    const { accountsAndTriggers } = this.state

    const matchingTrigger = get(
      accountsAndTriggers.find(
        account => account.account._id === selectedAccountId
      ),
      'trigger'
    )

    if (matchingTrigger) this.fetchAccount(matchingTrigger)
  }

  requestAccountCreation() {
    const { createAction } = this.props
    if (createAction) createAction()
    else this.setState({ addingAccount: true })
  }

  async endAccountCreation(trigger) {
    this.setState({ addingAccount: false })
    const account = await this.fetchAccount(trigger)

    if (account) {
      this.setState(prevState => ({
        ...prevState,
        accountsAndTriggers: [
          ...prevState.accountsAndTriggers,
          {
            account,
            trigger
          }
        ]
      }))
    }
  }

  async fetchAccounts() {
    const { client } = this.props
    const triggers = this.props.konnector.triggers.data
    this.setState({ fetchingAccounts: true })
    try {
      const accountsAndTriggers = (await Promise.all(
        triggers.map(async trigger => {
          return {
            account: await fetchAccount(
              client,
              triggersModel.getAccountId(trigger)
            ),
            trigger
          }
        })
      )).filter(({ account }) => !!account)
      this.setState({
        accountsAndTriggers,
        fetchingAccounts: false,
        error: null
      })
    } catch (error) {
      this.setState({ error, fetchingAccounts: false })
    }
  }

  async fetchAccount(trigger) {
    const { client } = this.props
    this.setState({ fetching: true })

    try {
      const account = await fetchAccount(
        client,
        triggersModel.getAccountId(trigger)
      )
      this.setState({
        account,
        trigger
      })
      return account
    } catch (error) {
      this.setState({
        error
      })
    } finally {
      this.setState({
        fetching: false,
        error: null
      })
    }
  }

  fetchIcon() {
    const { client } = this.context
    const { konnector } = this.props
    return client.stackClient.getIconURL({
      type: 'konnector',
      slug: konnector.slug
    })
  }

  async refetchTrigger() {
    const { client } = this.props
    const { trigger } = this.state

    const upToDateTrigger = await fetchTrigger(client, trigger._id)
    this.setState({
      trigger: upToDateTrigger
    })
  }

  render() {
    const { dismissAction, konnector, into, t } = this.props
    const { account, accountsAndTriggers, addingAccount } = this.state

    return (
      <Modal
        dismissAction={dismissAction}
        mobileFullscreen
        size="small"
        into={into}
        closable={false}
        aria-label={t('modal.aria-label')}
      >
        <ModalHeader className="u-pr-2">
          <div className="u-flex u-flex-row u-w-100 u-flex-items-center">
            <div className="u-w-3 u-h-3 u-mr-half">
              <AppIcon fetchIcon={this.fetchIcon} />
            </div>
            <div className="u-flex-grow-1 u-mr-half">
              <h3 className="u-title-h3 u-m-0">{konnector.name}</h3>

              {accountsAndTriggers.length > 0 && account && !addingAccount && (
                <AccountSelectBox
                  selectedAccount={account}
                  accountsAndTriggers={accountsAndTriggers}
                  onChange={option => {
                    this.requestAccountChange(option.account, option.trigger)
                  }}
                  onCreate={this.requestAccountCreation}
                />
              )}
            </div>
            <Button
              icon={<Icon icon={CrossIcon} size={'24'} />}
              onClick={dismissAction}
              iconOnly
              label={t('close')}
              subtle
              theme={'secondary'}
            />
          </div>
        </ModalHeader>
        <ModalContent>{this.renderModalContent()}</ModalContent>
      </Modal>
    )
  }

  renderModalContent() {
    const { dismissAction, konnector, t } = this.props
    const {
      account,
      accountsAndTriggers,
      error,
      fetching,
      fetchingAccounts,
      trigger,
      addingAccount
    } = this.state

    if (fetching || fetchingAccounts) {
      return (
        <Spinner
          size="xxlarge"
          className="u-flex u-flex-justify-center u-pv-3"
        />
      )
    } else if (error) {
      return (
        <Infos
          actionButton={
            <Button theme="danger">{t('modal.konnector.error.button')}</Button>
          }
          title={t('modal.konnector.error.title')}
          text={t('modal.konnector.error.description', error)}
          isImportant
        />
      )
    } else if (addingAccount) {
      return (
        <div className="u-pt-1-half">
          <TriggerManager
            konnector={konnector}
            onLoginSuccess={this.endAccountCreation}
            onSuccess={this.endAccountCreation}
          />
        </div>
      )
    } else if (!account) {
      return (
        <>
          {konnectorsModel.hasNewVersionAvailable(konnector) && (
            <KonnectorUpdateInfos className="u-mb-1" konnector={konnector} />
          )}
          <AccountsList
            accounts={accountsAndTriggers}
            konnector={konnector}
            onPick={option => {
              this.requestAccountChange(option.account, option.trigger)
            }}
            addAccount={this.requestAccountCreation}
          />
        </>
      )
    } else {
      return (
        <KonnectorAccountTabs
          konnector={konnector}
          initialTrigger={trigger}
          account={account}
          onAccountDeleted={dismissAction}
          addAccount={this.requestAccountCreation}
          refetchTrigger={this.refetchTrigger}
        />
      )
    }
  }
}

KonnectorModal.propTypes = {
  into: PropTypes.string,
  konnector: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
    vendor_link: PropTypes.string,
    triggers: PropTypes.shape({
      data: PropTypes.arrayOf(PropTypes.object)
    })
  }).isRequired,
  dismissAction: PropTypes.func.isRequired,
  createAction: PropTypes.func,
  onAccountChange: PropTypes.func,
  t: PropTypes.func.isRequired
}

KonnectorModal.defaultProps = {
  into: 'body'
}

export default withClient(translate()(KonnectorModal))
