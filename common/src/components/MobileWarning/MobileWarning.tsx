import { Box, Fade, Stack, Typography } from '@linagora/twake-mui'
import { useI18n } from 'twake-i18n'

export const MobileWarning: React.FC = () => {
  const { t } = useI18n()

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            component="img"
            src="/contacts.svg"
            alt="Contacts"
            sx={{
              width: 72,
              height: 72,
              display: 'block'
            }}
          />

          <Typography variant="h5">{t('mobile.comingSoon.title')}</Typography>

          <Typography
            variant="body1"
            sx={{
              width: '100%',
              wordBreak: 'break-word'
            }}
          >
            {t('mobile.comingSoon.subtitle')}
          </Typography>
        </Stack>
      </Box>
    </Fade>
  )
}
