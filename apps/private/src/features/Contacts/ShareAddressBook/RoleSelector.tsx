import React, { useEffect, useId, useRef, useState } from 'react'
import {
  ActionsMenu,
  ActionsMenuItem,
  Button,
  ListItemIcon,
  ListItemText
} from '@linagora/twake-mui'
import {
  Dropdown,
  Icon,
  RadioChecked,
  RadioUnchecked
} from '@linagora/twake-icons'
import { useI18n } from 'twake-i18n'
import { AddressBookAccessLevel } from '@common/features/Contacts/davTypes'
import { getRoleTranslationKey } from './sharingHelpers'

interface RoleSelectorProps {
  value: AddressBookAccessLevel
  onChange: (role: AddressBookAccessLevel) => void
  disabled?: boolean
  'aria-label'?: string
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  'aria-label': ariaLabel
}) => {
  const { t } = useI18n()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const menuId = useId()
  // Picking a role may disable the selector while it saves, which drops the
  // focus to <body>: give it back once the selector is enabled again
  const refocusOnEnableRef = useRef(false)

  useEffect(() => {
    if (!disabled && refocusOnEnableRef.current) {
      refocusOnEnableRef.current = false
      anchorRef.current?.focus()
    }
  }, [disabled])
  const roleKey = getRoleTranslationKey(value)
  const roles = [AddressBookAccessLevel.Editor, AddressBookAccessLevel.Viewer]
  // Only offer read-write for a sharee who already has it.
  if (value === AddressBookAccessLevel.ReadWrite) {
    roles.push(AddressBookAccessLevel.ReadWrite)
  }

  return (
    <>
      <Button
        ref={anchorRef}
        variant="text"
        size="small"
        color="inherit"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        endIcon={<Icon icon={Dropdown} />}
        onClick={() => setOpen(true)}
      >
        {roleKey ? t(roleKey) : ''}
      </Button>
      <ActionsMenu
        ref={anchorRef}
        id={menuId}
        open={open && !disabled}
        onClose={() => setOpen(false)}
      >
        {roles.map(role => (
          <ActionsMenuItem
            key={role}
            role="menuitemradio"
            aria-checked={value === role}
            onClick={() => {
              refocusOnEnableRef.current = true
              onChange(role)
            }}
          >
            <ListItemIcon>
              <Icon
                icon={value === role ? RadioChecked : RadioUnchecked}
                color={value === role ? 'primary' : 'inherit'}
              />
            </ListItemIcon>
            <ListItemText>{t(getRoleTranslationKey(role) || '')}</ListItemText>
          </ActionsMenuItem>
        ))}
      </ActionsMenu>
    </>
  )
}
