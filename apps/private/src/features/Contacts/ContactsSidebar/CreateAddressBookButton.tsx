import React from 'react'
import { Icon, Plus } from '@linagora/twake-icons'
import { IconButton, Tooltip } from '@linagora/twake-mui'

export interface CreateAddressBookButtonProps {
  onClick: () => void
  label: string
}

export const CreateAddressBookButton: React.FC<
  CreateAddressBookButtonProps
> = ({ onClick, label }) => {
  return (
    <Tooltip title={label}>
      <IconButton
        size="xsmall"
        aria-label={label}
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
