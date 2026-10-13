import { useState } from 'react'
import { useAppSelector } from '@common/app/hooks'
import {
  getAddressBookDisplayName,
  isHiddenAddressBook,
  sortAddressBooks
} from '@common/features/Contacts/contactsUtils'
import { Company, Icon, Plus, ContactList } from '@linagora/twake-icons'
import {
  Box,
  Nav,
  NavIcon,
  NavItem,
  NavLink,
  NavText,
  Sidebar,
  Button,
  Tooltip,
  NavDropdown,
  IconButton,
  NavDesktopDropdown
} from '@linagora/twake-mui'
import { Link, NavigateFunction, useNavigate, useParams } from 'react-router'
import { useI18n } from 'twake-i18n'
import { Peoples } from '@linagora/twake-icons'

import {
  AddressBook,
  AddressBookWithContacts
} from '@common/features/Contacts/contactsTypes'
import { matchesScope } from '@common/features/Contacts/contactsSelectors'

interface ContactsSidebarProps {
  onOpenCreateBook: () => void
}

const CreateAddressBookButton: React.FC<{ onClick: () => void }> = ({
  onClick
}) => {
  const { t } = useI18n()
  return (
    <Tooltip title={t('contacts.addressBook.createTitle')}>
      <IconButton
        size="xsmall"
        aria-label={t('contacts.addressBook.createTitle')}
        onClick={e => {
          e.stopPropagation()
          onClick()
        }}
      >
        <Icon icon={Plus} size={14} />
      </IconButton>
    </Tooltip>
  )
}

export const ContactsSidebar: React.FC<ContactsSidebarProps> = ({
  onOpenCreateBook
}) => {
  const [isMyContactsExpanded, setIsMyContactsExpanded] = useState(true)
  const { t } = useI18n()
  const { addressBookId } = useParams()
  const navigate = useNavigate()
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const addressBooks = useAppSelector(state => state.contacts.addressBooks)
  const currentBook = addressBookId ? addressBooks[addressBookId] : undefined
  const canWriteCurrentBook =
    (currentBook?.canWrite && addressBookId !== 'dab') ?? false
  const otherBooks = sortAddressBooks(
    Object.values(addressBooks).filter(
      (book: AddressBookWithContacts) =>
        !isHiddenAddressBook(book.id) && book.id !== 'dab'
    ) as AddressBook[],
    t
  )

  const personnalBooks = otherBooks.filter(book =>
    matchesScope(book, 'onlyMine', openpaasId)
  )
  const sharedBooks = otherBooks.filter(book =>
    matchesScope(book, 'shared', openpaasId)
  )

  const domainBooks = Object.values(addressBooks).filter(
    (book: AddressBookWithContacts) => book.id === 'dab'
  ) as AddressBook[]

  const createLink =
    addressBookId && canWriteCurrentBook
      ? `/contacts/${addressBookId}/new`
      : '/contacts/new'

  return (
    <Sidebar>
      <Box className="u-mh-1 u-mt-1">
        <Button
          variant="contained"
          fullWidth
          startIcon={<Icon size={12} icon={Plus} />}
          component={Link}
          to={createLink}
          className="u-bdrs-6 u-fz-small"
        >
          {t('contacts.create')}
        </Button>
      </Box>
      <Box className="u-flex-auto u-ov-auto u-mt-1-half">
        <Nav className="u-mv-0">
          <NavItem
            secondaryAction={
              <CreateAddressBookButton onClick={onOpenCreateBook} />
            }
          >
            {personnalBooks.length === 0 ? (
              <NavLink
                selected={addressBookId === undefined}
                onClick={() => {
                  void navigate('/contacts')
                }}
              >
                <NavIcon icon={ContactList} />
                <NavText>{t('contacts.myContacts')}</NavText>
              </NavLink>
            ) : (
              <NavDropdown
                open={isMyContactsExpanded}
                onToggle={() => setIsMyContactsExpanded(!isMyContactsExpanded)}
                selected={addressBookId === undefined}
                onClick={() => {
                  void navigate('/contacts')
                }}
              >
                <NavIcon icon={ContactList} />
                <NavText>{t('contacts.myContacts')}</NavText>
              </NavDropdown>
            )}
          </NavItem>

          {isMyContactsExpanded &&
            personnalBooks.map(book => (
              <ContactRow
                key={book.id}
                book={book}
                variant="secondary"
                navigate={navigate}
                addressBookId={addressBookId}
                t={t}
              />
            ))}

          {domainBooks.map(book => (
            <NavItem key={book.id}>
              <NavLink
                onClick={() => {
                  void navigate(`/contacts/${book.id}`)
                }}
                selected={addressBookId === book.id}
              >
                <NavIcon icon={Company} />
                <NavText>
                  <span className="u-ellipsis u-db">
                    {getAddressBookDisplayName(book, t)}
                  </span>
                </NavText>
              </NavLink>
            </NavItem>
          ))}
          <NavDesktopDropdown label={t('contacts.shared')} limit={0}>
            {sharedBooks?.map(book => (
              <ContactRow
                key={book.id}
                book={book}
                variant="primary"
                navigate={navigate}
                addressBookId={addressBookId}
                t={t}
              />
            ))}
          </NavDesktopDropdown>
        </Nav>
      </Box>
    </Sidebar>
  )
}

function ContactRow({
  book,
  variant,
  navigate,
  addressBookId,
  t
}: {
  book: AddressBook
  variant: 'primary' | 'secondary' | 'tertiary' | undefined
  navigate: NavigateFunction
  addressBookId?: string
  t: (key: string, param?: Record<string, string>) => string
}) {
  return (
    <NavItem variant={variant}>
      <NavLink
        onClick={() => {
          void navigate(`/contacts/${book.id}`)
        }}
        selected={addressBookId === book.id}
      >
        <NavIcon icon={Peoples} />
        <Tooltip title={getAddressBookDisplayName(book, t)}>
          <NavText secondaryText={book.ownerDisplayName}>
            <span className="u-ellipsis u-db">
              {getAddressBookDisplayName(book, t)}
            </span>
          </NavText>
        </Tooltip>
      </NavLink>
    </NavItem>
  )
}
