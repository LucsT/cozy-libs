import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { translate } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'

import DocumentQualification from './DocumentQualification'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import Button from 'cozy-ui/transpiled/react/Button'

import { getTracker } from 'cozy-ui/transpiled/react/helpers/tracker'

const pushAnalytics = qualification => {
  const tracker = getTracker()
  if (tracker) {
    tracker.push(['trackEvent', 'Drive', 'Scanner', 'Add Qualification'])
    if (qualification && qualification.label) {
      tracker.push([
        'trackEvent',
        'Drive',
        'Qualification',
        qualification.label
      ])
    }
  }
}
/**
 * ModalScannerQualification component
 *
 * Displayed just after taking a
 * photo on a mobile device from the Scanner feature.
 *
 * It displays a modal with the `Qualification` Process.
 * ATM the `Qualificiation` process is only about choosing the
 * right category for a document but soon we'll have rename and
 * one day OCR.
 */
class ModalScannerQualification extends Component {
  state = {
    qualification: undefined,
    filename: ''
  }

  render() {
    const { onSave, t, dismissAction } = this.props
    const { qualification, filename } = this.state
    return (
      <FixedDialog
        open={true}
        onClose={dismissAction}
        title={t('Scan.save_doc')}
        content={
          <DocumentQualification
            onDescribed={(qualification, filename) => {
              this.setState({ qualification, filename })
            }}
            onFileNameChanged={filename => {
              this.setState({ filename })
            }}
            allowEditFileName={true}
            title={t('Scan.qualify')}
          />
        }
        actions={
          <>
            <Button
              theme="secondary"
              onClick={dismissAction}
              label={t('Scan.cancel')}
            />
            <Button
              theme="primary"
              label={t('Scan.save')}
              onClick={async () => {
                pushAnalytics(qualification)
                try {
                  await onSave(qualification, filename)
                } catch (error) {
                  Alerter.error(t('Scan.error.generic'))
                }
              }}
            />
          </>
        }
        actionsLayout="row"
      />
    )
  }
}

ModalScannerQualification.propTypes = {
  /**
   * primary action of the modal
   *
   */
  onSave: PropTypes.func.isRequired,
  dismissAction: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}
export default translate()(ModalScannerQualification)
