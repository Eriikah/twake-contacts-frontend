import { ListItem, ListItemAvatar, ListItemText, Paper } from '@mui/material'
import { IconButton } from '@linagora/twake-mui'
import { Cross, Icon } from '@linagora/twake-icons'
import { useI18n } from 'twake-i18n'

interface EntryPaperProps {
  avatar: React.ReactNode
  primary: string
  secondary?: string
  onRemove?: () => void
}

export function EntryPaper({
  avatar,
  primary,
  secondary,
  onRemove
}: EntryPaperProps): JSX.Element {
  const { t } = useI18n()
  return (
    <Paper variant="outlined">
      <ListItem
        secondaryAction={
          onRemove && (
            <IconButton
              aria-label={t('contacts.form.close')}
              onClick={onRemove}
            >
              <Icon icon={Cross} />
            </IconButton>
          )
        }
      >
        <ListItemAvatar className="u-miw-1">{avatar}</ListItemAvatar>
        <ListItemText primary={primary} secondary={secondary} />
      </ListItem>
    </Paper>
  )
}
