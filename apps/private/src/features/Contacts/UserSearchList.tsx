import { AddressBook } from '@common/features/Contacts/contactsTypes'
import { OpenPaasUserData } from '@common/features/User/type/OpenPaasUserData'
import { Bottom, Icon, Right } from '@linagora/twake-icons'
import {
  Avatar,
  Box,
  Button,
  Skeleton,
  Stack,
  Typography
} from '@linagora/twake-mui'
import React from 'react'
import { useI18n } from 'twake-i18n'
import { AddressBookPaper } from './AddressBookPaper'
import { usePublicAddressBooks } from './usePublicAddressBooks'

interface UserSearchListProps {
  users: OpenPaasUserData[]
  loading: boolean
  isSubscribing?: boolean
  onSubscribe: (user: OpenPaasUserData, books: AddressBook[]) => void
}

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')

const BookRowSkeleton: React.FC = () => (
  <Stack direction="row" className="u-flex-items-center u-flex-justify-between">
    <Skeleton animation="wave" variant="text" width={180} />
    <Skeleton animation="wave" variant="rounded" width={90} height={30} />
  </Stack>
)

const UserRow: React.FC<{
  user: OpenPaasUserData
  expanded: boolean
  onToggle: () => void
  panel: React.ReactNode
  action?: React.ReactNode
}> = ({ user, expanded, onToggle, panel, action }) => {
  const name = user.names?.[0]?.displayName

  return (
    <Stack direction="row" spacing={2}>
      <Stack className="u-flex-none u-maw-5 u-flex-self-start">
        <Stack
          direction="row"
          spacing={2}
          className="u-flex-items-center u-c-pointer"
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onClick={onToggle}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onToggle()
            }
          }}
        >
          <Avatar alt={name} size="xl">
            {getInitials(name ?? '')}
          </Avatar>
          <Stack className="u-media-grow">
            <Typography variant="subtitle1" noWrap>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user.emailAddresses?.[0]?.value}
            </Typography>
          </Stack>
          <Icon icon={expanded ? Bottom : Right} />
        </Stack>

        {action}
      </Stack>
      {expanded && (
        <Box className="u-media-grow u-flex-self-center">{panel}</Box>
      )}
    </Stack>
  )
}

const UserRowSkeleton: React.FC = () => (
  <Stack direction="row" spacing={2} className="u-flex-items-center">
    <Skeleton animation="wave" variant="circular" width={72} height={72} />
    <Stack spacing={0.5}>
      <Skeleton animation="wave" variant="text" width={200} />
      <Skeleton animation="wave" variant="text" width={140} />
    </Stack>
  </Stack>
)

export const UserSearchList: React.FC<UserSearchListProps> = ({
  users,
  loading,
  isSubscribing,
  onSubscribe
}) => {
  const { t } = useI18n()
  const {
    user: expandedUser,
    selectUser,
    clearUser,
    books,
    emptyMessageKey
  } = usePublicAddressBooks()

  if (!loading && users.length === 0) return null

  // no books and no message yet: the lookup for the open user is in flight
  const booksLoading = books.length === 0 && emptyMessageKey === null

  return (
    <Stack spacing={2}>
      <Typography variant="h6">
        {t('contacts.search.discoverContacts')}
      </Typography>
      <Stack spacing={2} className="u-mah-5 u-ov-auto u-flex-shrink-0">
        {loading
          ? [0, 1].map(i => <UserRowSkeleton key={i} />)
          : users.map(user => {
              const expanded = expandedUser?.id === user.id
              return (
                <UserRow
                  key={user.id}
                  user={user}
                  expanded={expanded}
                  onToggle={() => (expanded ? clearUser() : selectUser(user))}
                  panel={
                    <Stack spacing={1}>
                      {booksLoading ? (
                        [0, 1].map(i => <BookRowSkeleton key={i} />)
                      ) : emptyMessageKey ? (
                        <Typography variant="body2" color="text.secondary">
                          {t(emptyMessageKey)}
                        </Typography>
                      ) : (
                        books.map(book => (
                          <Stack
                            key={`${book.userId}/${book.id}`}
                            direction="row"
                            spacing={1}
                            className="u-flex-items-center"
                          >
                            <div className="u-media-grow">
                              <AddressBookPaper ownerName={''} book={book} />
                            </div>
                            <Button
                              size="small"
                              variant="outlined"
                              className="u-flex-none"
                              disabled={isSubscribing}
                              onClick={() => onSubscribe(user, [book])}
                            >
                              {t('contacts.addressBook.subscribe')}
                            </Button>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  }
                  action={
                    expanded && books.length > 0 ? (
                      <Button
                        variant="contained"
                        className="u-mt-1"
                        disabled={isSubscribing}
                        onClick={() => onSubscribe(user, books)}
                      >
                        {t('contacts.addressBook.subscribeAll')}
                      </Button>
                    ) : undefined
                  }
                />
              )
            })}
      </Stack>
    </Stack>
  )
}
