import { Avatar, AvatarProps, nameToColor } from '@linagora/twake-mui'
import { getInitials } from './getInitials'

interface ContactAvatarProps {
  displayName: string
  size: AvatarProps['size']
  src?: string
}

/**
 * Colour is derived from the full display name, like twake-mui's
 * ContactPopover, so a contact keeps the same avatar colour everywhere.
 */
export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  displayName,
  size,
  src
}) => (
  <Avatar size={size} src={src} color={nameToColor(displayName) ?? 'sunrise'}>
    {getInitials(displayName)}
  </Avatar>
)
