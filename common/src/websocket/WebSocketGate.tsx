import { useAppSelector } from '@common/app/hooks'
import { useWebSocket } from '@linagora/twake-websocket'
import { useEffect, useState } from 'react'
import { api } from '@common/utils/apiUtils'

interface WebSocketTicket {
  clientAddress: string
  value: string
  generatedOn: string
  validUntil: string
  username: string
}

export function WebSocketGate(): JSX.Element | null {
  const isAuthenticated = useAppSelector(state =>
    Boolean(state.user.userData && state.user.tokens)
  )
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setUrl(null)
      return
    }

    const fetchTicket = async (): Promise<void> => {
      try {
        const response = await api.post('ws/ticket')
        if (!response.ok) {
          throw new Error('Failed to fetch WebSocket ticket')
        }
        const ticket: WebSocketTicket = await response.json()
        const wsBaseUrl = window.WEBSOCKET_URL
        if (!wsBaseUrl) {
          console.warn('WEBSOCKET_URL is not defined')
          return
        }
        setUrl(`${wsBaseUrl}/ws?ticket=${encodeURIComponent(ticket.value)}`)
      } catch (err) {
        console.warn('Failed to fetch WebSocket ticket:', err)
      }
    }

    void fetchTicket()
  }, [isAuthenticated])

  useWebSocket({
    url: url ?? '',
    enabled: isAuthenticated && !!url,
    onMessage: message => {
      console.info('WebSocket message received:', message)
    },
    onClose: event => {
      if (event.code !== 1000 && event.code !== 1001) {
        console.warn('WebSocket closed:', event.code, event.reason)
      }
    },
    onError: error => {
      console.error('WebSocket error:', error)
    }
  })

  return null
}
