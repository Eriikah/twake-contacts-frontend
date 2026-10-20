import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack
} from '@linagora/twake-mui'
import { Cross, Icon } from '@linagora/twake-icons'
import { generateMailComposerUrl } from '@linagora/twake-utils'
import { useI18n } from 'twake-i18n'
import { useAppSelector } from '@common/app/hooks'
import { Contact, UserResult } from '@common/features/Contacts/contactsTypes'
import { buildSharedContactUrl } from '@/features/Contacts/sharedContact'
import { UserAutocomplete } from '../UserAutocomplete'

interface ShareContactDialogProps {
  contact: Contact
  onClose: () => void
}

export const ShareContactDialog: React.FC<ShareContactDialogProps> = ({
  contact,
  onClose
}) => {
  const { t } = useI18n()
  const workplaceFqdn = useAppSelector(
    state => state.user.userData?.workplaceFqdn
  )
  const [recipient, setRecipient] = useState<UserResult | null>(null)

  const recipientEmail = recipient?.emails[0]?.value
  const canShare = Boolean(recipientEmail && window.MAIL_SPA_URL)

  const handleShare = (): void => {
    if (!recipientEmail || !window.MAIL_SPA_URL) return

    const url = generateMailComposerUrl(
      window.MAIL_SPA_URL,
      [recipientEmail],
      { workplaceFqdn, workplaceFqdnFallback: window.WORKPLACE_FQDN_FALLBACK },
      t('contacts.shareContact.emailSubject', { name: contact.displayName }),
      t('contacts.shareContact.emailBody', {
        name: contact.displayName,
        url: buildSharedContactUrl(contact)
      })
    )
    if (!url) return
    window.open(url, '_blank', 'noopener')
    onClose()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="u-pb-0">
        <Stack
          direction="row"
          className="u-flex-items-center u-flex-justify-between"
        >
          {t('contacts.shareContact.title', { name: contact.displayName })}
          <IconButton
            edge="end"
            aria-label={t('contacts.form.close')}
            onClick={onClose}
          >
            <Icon icon={Cross} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent className="u-pb-2 u-pt-1">
        <UserAutocomplete
          onSelect={setRecipient}
          onType={() => setRecipient(null)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('contacts.form.cancel')}</Button>
        <Button variant="contained" onClick={handleShare} disabled={!canShare}>
          {t('contacts.shareContact.send')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
