import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Infos from 'cozy-ui/transpiled/react/Infos'
import Text, { SubTitle } from 'cozy-ui/transpiled/react/Text'

import KonnectorUpdateLinker from '../KonnectorUpdateLinker'

/**
 * Warns the user that a new version is available for the given konnector.
 * Offer a button to redirect to an app able to update a konnector
 * (typically the store).
 */
const KonnectorUpdateInfos = props => {
  const { t } = useI18n()
  const { className, konnector, isBlocking } = props
  return (
    <Infos
      className={className}
      theme={isBlocking ? 'danger' : 'secondary'}
      description={
        <>
          <SubTitle className={isBlocking ? 'u-error' : ''}>
            {t('infos.konnectorUpdate.title')}
          </SubTitle>
          <Text>
            {isBlocking
              ? t('infos.konnectorUpdate.body.blocking')
              : t('infos.konnectorUpdate.body.regular')}
          </Text>
        </>
      }
      action={
        <KonnectorUpdateLinker
          konnector={konnector}
          isBlocking={isBlocking}
          label={t('infos.konnectorUpdate.button.label')}
        />
      }
    />
  )
}

KonnectorUpdateInfos.propTypes = {
  konnector: PropTypes.object.isRequired,
  className: PropTypes.string,
  isBlocking: PropTypes.bool
}

export default React.memo(KonnectorUpdateInfos)
