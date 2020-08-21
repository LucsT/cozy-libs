import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Modal, { ModalContent } from 'cozy-ui/transpiled/react/Modal'
import { translate } from 'cozy-ui/transpiled/react/I18n'

import styles from '../share.styl'

import { contactsResponseType, groupsResponseType } from '../propTypes'
import { default as DumbShareByLink } from './ShareByLink'
import { default as DumbShareByEmail } from './ShareByEmail'
import WhoHasAccess from './WhoHasAccess'

export const ShareModal = ({
  document,
  isOwner,
  sharingDesc,
  contacts,
  groups,
  createContact,
  link,
  permissions,
  recipients,
  documentType = 'Document',
  needsContactsPermission,
  hasSharedParent,
  hasSharedChild,
  onClose,
  onShare,
  onRevoke,
  onShareByLink,
  onUpdateShareLinkPermissions,
  onRevokeLink,
  onRevokeSelf,
  t
}) => {
  return (
    <Modal
      title={t(`${documentType}.share.title`)}
      dismissAction={onClose}
      into="body"
      size="small"
      spacing="small"
      mobileFullscreen
    >
      {(hasSharedParent || hasSharedChild) && (
        <div className={styles['share-byemail-onlybylink']}>
          {t(`${documentType}.share.shareByEmail.onlyByLink`, {
            type: t(
              `${documentType}.share.shareByEmail.type.${
                document.type === 'directory' ? 'folder' : 'file'
              }`
            )
          })}{' '}
          <strong>
            {t(
              `${documentType}.share.shareByEmail.${
                hasSharedParent ? 'hasSharedParent' : 'hasSharedChild'
              }`
            )}
          </strong>
        </div>
      )}
      <ModalContent
        className={cx(
          styles['share-modal-content'],
          styles['share-moral-override-bottom']
        )}
      >
        {documentType !== 'Notes' &&
          documentType !== 'Albums' &&
          !hasSharedParent &&
          !hasSharedChild && (
            <DumbShareByEmail
              currentRecipients={recipients}
              document={document}
              documentType={documentType}
              sharingDesc={sharingDesc}
              contacts={contacts}
              groups={groups}
              createContact={createContact}
              onShare={onShare}
              needsContactsPermission={needsContactsPermission}
            />
          )}
        <div className={styles['share-modal-separator']} />
        <div className={styles['share-modal-secondary']}>
          <div className={cx(styles['share-modal-margins'], 'u-pb-1')}>
            <DumbShareByLink
              document={document}
              permissions={permissions}
              documentType={documentType}
              checked={link !== null}
              link={link}
              onEnable={onShareByLink}
              onDisable={onRevokeLink}
              onChangePermissions={onUpdateShareLinkPermissions}
            />
            {documentType !== 'Albums' && (
              <WhoHasAccess
                className={'u-mt-1'}
                isOwner={isOwner}
                recipients={recipients}
                document={document}
                documentType={documentType}
                onRevoke={onRevoke}
                onRevokeSelf={onRevokeSelf}
              />
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
export default translate()(ShareModal)
ShareModal.propTypes = {
  document: PropTypes.object.isRequired,
  permissions: PropTypes.array.isRequired,
  isOwner: PropTypes.bool,
  sharingDesc: PropTypes.string,
  contacts: contactsResponseType.isRequired,
  groups: groupsResponseType.isRequired,
  createContact: PropTypes.func.isRequired,
  recipients: PropTypes.array.isRequired,
  link: PropTypes.string.isRequired,
  documentType: PropTypes.string,
  needsContactsPermission: PropTypes.bool,
  hasSharedParent: PropTypes.bool,
  hasSharedChild: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
  onShareByLink: PropTypes.func.isRequired,
  onUpdateShareLinkPermissions: PropTypes.func.isRequired,
  onRevokeLink: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}
