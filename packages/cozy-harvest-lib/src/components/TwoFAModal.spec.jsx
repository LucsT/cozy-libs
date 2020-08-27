import React from 'react'
import { mount } from 'enzyme'
import { TwoFAModal } from './TwoFAModal'
import ConnectionFlow from '../models/ConnectionFlow'
import { Text, Field } from 'cozy-ui/transpiled/react'
import en from '../locales/en.json'
import Polyglot from 'node-polyglot'

jest.mock('./KonnectorIcon', () => () => null)

describe('TwoFAModal', () => {
  const polyglot = new Polyglot()
  polyglot.extend(en)

  const setup = ({ konnectorSlug, account }) => {
    const client = {
      on: jest.fn()
    }

    const trigger = {}
    const flow = new ConnectionFlow(client, trigger)

    flow.getAccount = () => account
    flow.getKonnectorSlug = () => konnectorSlug

    const root = mount(
      <TwoFAModal
        dismissAction={jest.fn()}
        flow={flow}
        t={polyglot.t.bind(polyglot)}
        breakpoints={{ isMobile: true }}
        account={account}
        client={client}
      />
    )
    return { root, flow }
  }

  const getDesc = root => root.find(Text).text()
  const getFieldLabel = root => root.find(Field).props().label
  const getInputValue = root =>
    root
      .find('input')
      .props()
      .value.toString()

  it('should work even with unknown 2FA', () => {
    const opts = {
      account: {
        state: 'TWO_FA_NEEDED.UNKNOWN'
      },
      konnectorSlug: 'boursoma83'
    }
    const { root } = setup(opts)

    // show an input by default
    expect(root.find('input').length).toBe(1)
    expect(root.text()).toContain(
      'This code enables you to finish your connexion.'
    )
  })

  it('should work', () => {
    const opts = {
      account: {
        state: 'TWO_FA_NEEDED.APP'
      },
      konnectorSlug: 'boursoma83'
    }
    const { root } = setup(opts)
    // no input for app two fa
    expect(root.find('input').length).toBe(0)
    expect(root.text()).toContain(
      `You need to open your provider's app and/or click on a notification to confirm your authentication.`
    )
  })

  it('should correctly unmount', () => {
    const { root } = setup({})
    expect(() => root.instance().componentWillUnmount()).not.toThrow()
  })

  it('should work for several two fa requests', () => {
    const opts = {
      account: {
        state: 'TWO_FA_NEEDED.SMS'
      },
      konnectorSlug: 'boursoma83'
    }
    const { root, flow } = setup(opts)
    const inp = root.find('input')

    expect(inp.length).toBe(1)
    expect(getInputValue(root)).toBe('')
    expect(getDesc(root)).toBe(
      'This code enables you to finish your connexion.'
    )
    expect(getFieldLabel(root)).toContain('code')
    root.setState({ twoFACode: 'abcd' })
    root.update()
    expect(getInputValue(root)).toBe('abcd')

    // 2nd 2FA request
    flow.emit('twoFARequest')
    root.update()
    expect(getInputValue(root)).toBe('')
    expect(getDesc(root)).toBe(
      'The second code received on your mobile phone or by email enables you to finalize your connexion.'
    )
    expect(getFieldLabel(root)).toBe('Second code')
    flow.emit('twoFARequest')
    root.update()

    // 3rd 2FA (should not happen, hypothetical case)
    flow.emit('twoFARequest')
    root.update()
    expect(getInputValue(root)).toBe('')
    // First attempt translations are re-used
    expect(getDesc(root)).toContain(
      'This code enables you to finish your connexion.'
    )
    expect(getFieldLabel(root)).toBe('code (4)')
    flow.emit('twoFARequest')
    root.update()
  })
})
