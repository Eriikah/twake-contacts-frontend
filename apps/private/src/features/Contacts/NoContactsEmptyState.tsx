import { Empty, Stack, Typography } from '@linagora/twake-mui'
import { useI18n } from 'twake-i18n'

interface NoContactsEmptyStateProps {
  action: React.ReactNode
}

export const NoContactsEmptyState: React.FC<NoContactsEmptyStateProps> = ({
  action
}) => {
  const { t } = useI18n()

  return (
    <Empty
      icon={
        <img
          src="/assets/images/svg/no-contact.svg"
          alt=""
          width={200}
          height={80}
        />
      }
      iconSize="normal"
      text={
        <Stack
          spacing={2}
          className="u-flex u-flex-items-center u-flex-justify-center u-flex-grow-1"
        >
          <Typography variant="body1">
            {t('contacts.empty.subtitle')}
          </Typography>
          {action}
        </Stack>
      }
      title={t('contacts.empty.title')}
    />
  )
}
