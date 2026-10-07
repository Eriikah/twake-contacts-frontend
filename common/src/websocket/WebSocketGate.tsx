import { useAppSelector } from '@common/app/hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  closeWebSocketConnection,
  establishWebSocketConnection,
  setupWebSocketPing,
  type PingCleanup,
  type WebSocketWithCleanup,
  useWebSocketReconnect,
  registerWebSocketState,
  setWebSocketConnecting
} from '@linagora/twake-websocket'
import { api } from '@common/utils/apiUtils'

export function WebSocketGate(): JSX.Element | null {
  const socketRef = useRef<WebSocketWithCleanup | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)
  const pingCleanupRef = useRef<PingCleanup | null>(null)

  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didConnectTimeoutRef = useRef(false)
  const CONNECT_TIMEOUT_MS = 10_000

  const hadSocketBeforeRef = useRef(false)
  const justReconnectedRef = useRef(false)

  const isAuthenticated = useAppSelector(state =>
    Boolean(state.user.userData && state.user.tokens)
  )
  const isAuthenticatedRef = useRef(isAuthenticated)

  const [isSocketOpen, setIsSocketOpen] = useState(false)
  const [shouldConnect, setShouldConnect] = useState(false)

  const onMessage = useCallback((message: unknown) => console.info(message), [])

  const { scheduleReconnect, clearReconnectTimeout } = useWebSocketReconnect(
    reconnectTimeoutRef,
    isAuthenticatedRef,
    reconnectAttemptsRef,
    setShouldConnect
  )

  const onClose = useCallback(
    (event: CloseEvent) => {
      // Socket already cleaned up by internal handler before this callback fires
      socketRef.current = null
      setIsSocketOpen(false)

      // Only attempt reconnection if it wasn't a normal closure
      // Code 1000 = normal closure, 1001 = going away (e.g., page unload)
      if (event.code !== 1000 && event.code !== 1001) {
        console.warn(
          `WebSocket closed unexpectedly (code: ${event.code}, reason: ${event.reason || 'none'}). ` +
            `Attempting to reconnect...`
        )
        scheduleReconnect()
      } else {
        reconnectAttemptsRef.current = 0
        clearReconnectTimeout()
      }
    },
    [scheduleReconnect, clearReconnectTimeout]
  )

  const onError = useCallback((error: Event) => {
    console.error('WebSocket error:', error)
  }, [])

  const callBacks = useMemo(
    () => ({
      onMessage,
      onClose,
      onError
    }),
    [onMessage, onClose, onError]
  )

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])

  // Reset reconnection state on successful connection and mark for calendar re-sync
  useEffect(() => {
    if (isSocketOpen) {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current)
        connectTimeoutRef.current = null
      }

      // Reset timeout marker on successful connection
      didConnectTimeoutRef.current = false

      if (hadSocketBeforeRef.current) {
        justReconnectedRef.current = true
      }

      hadSocketBeforeRef.current = true
      reconnectAttemptsRef.current = 0

      clearReconnectTimeout()
    }
  }, [isSocketOpen, clearReconnectTimeout])

  // Manage WebSocket connection
  useEffect(() => {
    const abortController = new AbortController()

    const cleanup = (): void => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current)
        connectTimeoutRef.current = null
      }
      closeWebSocketConnection(socketRef, setIsSocketOpen)
      clearReconnectTimeout()
    }

    if (!isAuthenticated) {
      cleanup()
      reconnectAttemptsRef.current = 0

      hadSocketBeforeRef.current = false
      return
    }

    const connect = async (): Promise<void> => {
      if (isConnectingRef.current || isSocketOpen) return
      isConnectingRef.current = true
      setWebSocketConnecting(true)
      didConnectTimeoutRef.current = false
      connectTimeoutRef.current = setTimeout(() => {
        console.warn('WebSocket connection attempt timed out')

        didConnectTimeoutRef.current = true
        abortController.abort()
        connectTimeoutRef.current = null
        isConnectingRef.current = false
        setWebSocketConnecting(false)
        cleanup()

        scheduleReconnect()
      }, CONNECT_TIMEOUT_MS)

      try {
        await establishWebSocketConnection(
          window.WEBSOCKET_URL || '',
          api,
          callBacks,
          socketRef,
          setIsSocketOpen,
          abortController.signal
        )
      } catch (err) {
        console.warn('WebSocket establishment failed:', err)

        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current)
          connectTimeoutRef.current = null
        }

        // Only schedule reconnect if the timeout handler hasn't already done so
        if (!didConnectTimeoutRef.current) {
          scheduleReconnect()
        }
      } finally {
        isConnectingRef.current = false
        setWebSocketConnecting(false)
      }
    }

    void connect()

    return (): void => {
      abortController.abort()
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    callBacks,
    clearReconnectTimeout,
    shouldConnect,
    scheduleReconnect
  ])

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = (): void => {
      if (!isSocketOpen && isAuthenticatedRef.current) {
        reconnectAttemptsRef.current = 0
        clearReconnectTimeout()
        setShouldConnect(prev => !prev)
      }
    }

    const handleOffline = (): void => {
      cleanupConnection()
    }

    const cleanupConnection = (): void => {
      closeWebSocketConnection(socketRef, setIsSocketOpen)
      clearReconnectTimeout()
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current)
        connectTimeoutRef.current = null
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return (): void => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isSocketOpen, isAuthenticated, clearReconnectTimeout])

  useEffect(() => {
    // Only set up ping if socket is open
    if (!isSocketOpen || !socketRef.current) {
      // Clean up existing ping if socket closed
      if (pingCleanupRef.current) {
        pingCleanupRef.current.stop()
        pingCleanupRef.current = null
      }
      return
    }

    // Set up ping monitoring
    const pingCleanup = setupWebSocketPing(socketRef.current, {
      onConnectionDead: () => {
        console.warn('WebSocket connection appears dead (no pong received)')

        // Trigger reconnection
        if (socketRef.current) {
          socketRef.current.close()
        }
      },
      onPingFail: () => {
        console.warn('Failed to send ping')
      }
    })

    pingCleanupRef.current = pingCleanup

    return (): void => {
      if (pingCleanupRef.current) {
        pingCleanupRef.current.stop()
        pingCleanupRef.current = null
      }
    }
  }, [isSocketOpen])

  const triggerReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    clearReconnectTimeout()
    setShouldConnect(prev => !prev)
  }, [clearReconnectTimeout])

  useEffect(() => {
    registerWebSocketState(socketRef, triggerReconnect)
  }, [triggerReconnect])

  return null
}
