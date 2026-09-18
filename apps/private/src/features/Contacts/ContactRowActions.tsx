import {
  IconButton,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@linagora/twake-mui'
import { Icon, Trash, Pen, Dots } from '@linagora/twake-icons'
import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import { deleteContact } from '@common/features/Contacts/ContactsSlice'
import { selectBook } from '@common/features/Contacts/contactsSelectors'
import { Contact } from '@common/features/Contacts/contactsTypes'
import { ErrorSnackbar } from '@common/components/Error/ErrorSnackbar'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from 'twake-i18n'
import { DeleteContactDialog } from './DeleteContactDialog'

interface ContactRowActionsProps {
  contact: Contact
  addressBookId: string
  onDeleted?: () => void
  isHovered?: boolean
}

type OpenDialog = 'delete' | null

export const ContactRowActions: React.FC<ContactRowActionsProps> = ({
  contact,
  addressBookId,
  onDeleted,
  isHovered
}) => {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const book = useAppSelector(state => selectBook(state, addressBookId))
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const isMenuOpen = Boolean(anchorEl)

  if (!book?.canWrite) return null

  const handleCloseDialog = (): void => setOpenDialog(null)
  const handleOpenDeleteDialog = (): void => {
    setAnchorEl(null)
    setOpenDialog('delete')
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = (event: React.MouseEvent): void => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  const handleEdit = (event: React.MouseEvent): void => {
    event.stopPropagation()
    void navigate(`/contacts/${addressBookId}/${contact.id}/edit`)
  }

  const handleDelete = async (): Promise<void> => {
    if (!openpaasId) return
    try {
      await dispatch(
        deleteContact({
          userId: openpaasId,
          addressBookId,
          contactId: contact.id
        })
      ).unwrap()
      setOpenDialog(null)
      onDeleted?.()
    } catch (error: unknown) {
      const err = error as { message?: string }
      setDeleteError(err.message || t('error.unknown'))
    }
  }

  return (
    <>
      <Stack direction="row" spacing={1} onClick={e => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            gap: 1,
            width: '50px',
            marginLeft: 'auto'
          }}
        >
          {(isHovered || isMenuOpen) && (
            <>
              <Tooltip title={t('contacts.menu.edit')}>
                <IconButton
                  size="xsmall"
                  aria-label={t('contacts.menu.edit')}
                  onClick={handleEdit}
                >
                  <Icon icon={Pen} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
        <Tooltip title={t('contacts.menu.more')}>
          <IconButton
            size="xsmall"
            aria-label={t('contacts.menu.more')}
            onClick={handleMenuOpen}
          >
            <Icon icon={Dots} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={e => e.stopPropagation()}
        >
          <MenuItem onClick={handleOpenDeleteDialog}>
            <ListItemIcon>
              <Icon icon={Trash} />
            </ListItemIcon>
            <ListItemText>{t('contacts.menu.delete')}</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
      {openDialog === 'delete' && (
        <DeleteContactDialog
          contact={contact}
          onClose={handleCloseDialog}
          onConfirm={() => void handleDelete()}
        />
      )}
      <ErrorSnackbar error={deleteError} onClose={() => setDeleteError(null)} />
    </>
  )
}
