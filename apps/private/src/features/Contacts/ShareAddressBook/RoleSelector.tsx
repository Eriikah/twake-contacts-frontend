import React, { useId, useRef, useState } from 'react'
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
  ariaLabel: string
  value: AddressBookAccessLevel
  onChange: (role: AddressBookAccessLevel) => void
  disabled?: boolean
  // Keeps the button focusable, unlike disabled, but ignores any role pick
  readOnly?: boolean
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  ariaLabel,
  value,
  onChange,
  disabled = false,
  readOnly = false
}) => {
  const { t } = useI18n()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const menuId = useId()
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
        aria-disabled={readOnly}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        endIcon={<Icon icon={Dropdown} />}
        onClick={() => setOpen(!readOnly)}
      >
        {roleKey ? t(roleKey) : ''}
      </Button>
      <ActionsMenu
        ref={anchorRef}
        id={menuId}
        open={open && !disabled && !readOnly}
        onClose={() => setOpen(false)}
      >
        {roles.map(role => (
          <ActionsMenuItem
            key={role}
            role="menuitemradio"
            aria-checked={value === role}
            onClick={() => {
              setOpen(false)
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
