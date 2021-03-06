/* eslint-env jest */
import React from 'react'
import { shallow } from 'enzyme'
import { render, fireEvent, cleanup } from '@testing-library/react'

import { DumbTriggerManager as TriggerManager } from 'components/TriggerManager'
import fixtures from '../../test/fixtures'
import ConnectionFlow from '../../src/models/ConnectionFlow'
import CozyClient from 'cozy-client'
import I18n from 'cozy-ui/transpiled/react/I18n'
import enLocale from '../../src/locales/en.json'

jest.mock('cozy-keys-lib', () => {
  const actual = jest.requireActual('cozy-keys-lib')
  return {
    ...actual,
    withVaultUnlockContext: Component => Component
  }
})
jest.mock('cozy-ui/transpiled/react/utils/color')
jest.mock('cozy-ui/transpiled/react/AppIcon', () => () => null)
jest.mock('../../src/components/KonnectorIcon', () => () => null)
jest.mock('cozy-doctypes', () => {
  const doctypes = jest.requireActual('cozy-doctypes')

  const CozyFolder = {
    copyWithClient: () => CozyFolder,
    ensureMagicFolder: () => ({ path: '/Administrative' }),
    magicFolders: {
      ADMINISTRATIVE: 'io.cozy.apps/administrative',
      PHOTOS: '/photos'
    }
  }

  return {
    ...doctypes,
    CozyFolder
  }
})

jest.mock('../../src/services/budget-insight', () => {
  const originalBudgetInsight = jest.requireActual(
    '../../src/services/budget-insight'
  )
  return {
    konnectorPolicy: {
      ...originalBudgetInsight.konnectorPolicy,
      onAccountCreation: jest.fn()
    }
  }
})

const mockVaultClient = {
  createNewCipher: jest.fn(),
  saveCipher: jest.fn(),
  getByIdOrSearch: jest.fn(),
  decrypt: jest.fn(),
  createNewCozySharedCipher: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  getAllDecrypted: jest.fn(),
  shareWithCozy: jest.fn(),
  isLocked: jest.fn().mockResolvedValue(false)
}

const tMock = jest.fn()

const client = new CozyClient({})
const props = {
  konnector: fixtures.konnector,
  flow: new ConnectionFlow(client, undefined, fixtures.konnector),
  flowState: {},
  t: tMock,
  vaultClient: mockVaultClient,
  breakpoints: { isMobile: false },
  onVaultDismiss: jest.fn()
}

const propsWithAccount = {
  ...props,
  flow: new ConnectionFlow(
    client,
    fixtures.existingTrigger,
    fixtures.konnector
  ),
  account: fixtures.existingAccount,
  trigger: fixtures.existingTrigger
}

const oAuthKonnector = {
  oauth: {
    scope: 'test'
  }
}
const oAuthProps = {
  ...props,
  konnector: oAuthKonnector,
  flow: new ConnectionFlow(client, undefined, oAuthKonnector)
}

describe('TriggerManager', () => {
  beforeEach(() => {
    mockVaultClient.createNewCozySharedCipher.mockResolvedValue({
      id: 'cipher-id-1'
    })
    tMock.mockImplementation(key => key)
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('when given an oauth konnector', () => {
    it('should redirect to OAuthForm', () => {
      mockVaultClient.getAll.mockResolvedValue([])
      const component = shallow(
        <I18n lang="en" dictRequire={() => enLocale}>
          <TriggerManager {...oAuthProps} konnector={oAuthKonnector} />
        </I18n>
      )
        .dive()
        .dive()
      expect(component.name()).toContain('OAuthForm')
    })
  })

  describe('when given no account', () => {
    describe('when the vault does not contain ciphers', () => {
      beforeEach(() => {
        mockVaultClient.getAll.mockResolvedValue([])
        mockVaultClient.getAllDecrypted.mockResolvedValue([])
      })

      it('should show the new account form', async () => {
        const { findByLabelText, findByTitle } = render(
          <I18n lang="en" dictRequire={() => enLocale}>
            <TriggerManager {...props} />
          </I18n>
        )

        await expect(findByLabelText('username')).resolves.toBeDefined()
        await expect(findByLabelText('passphrase')).resolves.toBeDefined()
        await expect(
          findByTitle('back', null, { timeout: 500 })
        ).rejects.toThrow()
      })
    })

    describe('when the vault contains ciphers', () => {
      beforeEach(() => {
        mockVaultClient.getAll.mockResolvedValue([{ id: 'cipher1' }])
        mockVaultClient.getAllDecrypted.mockResolvedValue([
          {
            id: 'cipher1',
            name: fixtures.konnector.name,
            login: {
              username: 'Isabelle'
            }
          }
        ])
      })

      it('should show the ciphers list', async () => {
        const { findByText } = render(
          <I18n lang="en" dictRequire={() => enLocale}>
            <TriggerManager {...props} />
          </I18n>
        )

        const cipherItem = await findByText('Isabelle')

        expect(cipherItem).toBeDefined()
      })

      describe('when selecting a cipher without password', () => {
        beforeEach(() => {
          mockVaultClient.getAll.mockResolvedValue([{ id: 'cipher1' }])
          mockVaultClient.getAllDecrypted.mockResolvedValue([
            {
              id: 'cipher1',
              name: fixtures.konnector.name,
              login: {
                username: 'Isabelle'
              }
            }
          ])
        })

        it('should show the account form with only password field editable', async () => {
          const { findByText, findByLabelText, findByTitle } = render(
            <I18n lang="en" dictRequire={() => enLocale}>
              <TriggerManager {...props} />
            </I18n>
          )

          const cipherItem = await findByText('Isabelle')

          fireEvent.click(cipherItem)

          const passwordField = await findByLabelText('passphrase')
          const backButton = await findByTitle('back')

          await expect(
            findByLabelText('username', null, { timeout: 500 })
          ).rejects.toThrow()
          expect(passwordField).toBeDefined()
          expect(backButton).toBeDefined()

          fireEvent.click(backButton)

          await expect(findByText('Isabelle')).resolves.toBeDefined()
        })
      })
    })
  })

  describe('when given an account', () => {
    describe('when the vault contains ciphers', () => {
      beforeEach(() => {
        mockVaultClient.getAll.mockResolvedValue([])
        mockVaultClient.getAllDecrypted.mockResolvedValue([])
      })

      it('should show the account form', async () => {
        const { findByLabelText } = render(
          <I18n lang="en" dictRequire={() => enLocale}>
            <TriggerManager {...propsWithAccount} />
          </I18n>
        )

        const usernameField = await findByLabelText('username')
        const passwordField = await findByLabelText('passphrase')

        expect(usernameField).toBeDefined()
        expect(passwordField).toBeDefined()
      })
    })

    describe('when the vault does not contain ciphers', () => {
      beforeEach(() => {
        mockVaultClient.getAll.mockResolvedValue([{ id: 'cipher1' }])
        mockVaultClient.getAllDecrypted.mockResolvedValue([
          {
            id: 'cipher1',
            name: fixtures.konnector.name,
            login: {
              username: 'Isabelle'
            }
          }
        ])
      })

      it('should show the account form', async () => {
        const { findByLabelText } = render(
          <I18n lang="en" dictRequire={() => enLocale}>
            <TriggerManager {...propsWithAccount} />
          </I18n>
        )

        const usernameField = await findByLabelText('username')
        const passwordField = await findByLabelText('passphrase')

        expect(usernameField).toBeDefined()
        expect(passwordField).toBeDefined()
      })
    })
  })

  describe('sending form', () => {
    beforeEach(() => {
      mockVaultClient.getAll.mockResolvedValue([])
      mockVaultClient.getAllDecrypted.mockResolvedValue([])
    })
    const setupForm = async ({ account } = {}) => {
      const flow = new ConnectionFlow(client)
      jest.spyOn(flow, 'handleFormSubmit').mockImplementation(() => {})
      const utils = render(
        <I18n lang="en" dictRequire={() => enLocale}>
          <TriggerManager {...props} account={account} flow={flow} />
        </I18n>
      )

      // Identification of inputs is a tad fragile, it should be better
      // if data-test-id were supported by Field
      // See https://github.com/cozy/cozy-ui/issues/1387
      const identifierLabel = await utils.findByLabelText('username')
      const passphraseLabel = await utils.findByLabelText('passphrase')
      const identifierInput = identifierLabel.nextElementSibling
      const passphraseInput =
        passphraseLabel.nextElementSibling instanceof HTMLInputElement
          ? passphraseLabel.nextElementSibling
          : passphraseLabel.nextElementSibling.nextElementSibling
      const submitButton = await utils.findByText('Submit')

      return {
        flow,
        identifierLabel,
        passphraseLabel,
        identifierInput,
        passphraseInput,
        submitButton,

        ...utils
      }
    }

    describe('when no account is passed in props', () => {
      it('should correctly send the form', async () => {
        const {
          flow,
          identifierInput,
          passphraseInput,
          submitButton
        } = await setupForm()
        fireEvent.change(identifierInput, {
          target: { value: 'my-identifier' }
        })
        fireEvent.change(passphraseInput, {
          target: { value: 'my-passphrase' }
        })
        fireEvent.click(submitButton)
        expect(flow.handleFormSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            account: undefined,
            userCredentials: {
              passphrase: 'my-passphrase',
              username: 'my-identifier'
            }
          })
        )
      })
    })

    describe('when an account is passed in props', () => {
      it('should correctly send the form', async () => {
        const account = {
          auth: {
            identifier: 'my-identifier',
            passphrase: 'my-old-passphrase'
          }
        }
        const {
          flow,
          identifierInput,
          passphraseInput,
          submitButton
        } = await setupForm({ account })
        fireEvent.change(identifierInput, {
          target: { value: 'my-identifier' }
        })
        fireEvent.change(passphraseInput, {
          target: { value: 'my-passphrase' }
        })
        fireEvent.click(submitButton)
        expect(flow.handleFormSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            account,
            userCredentials: {
              passphrase: 'my-passphrase',
              username: 'my-identifier',
              identifier: 'my-identifier'
            }
          })
        )
      })
    })
  })
})
