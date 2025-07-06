import SockJS from 'sockjs-client'
import { ref } from 'vue'
import Stomp from 'webstomp-client'
import { useAuthStore } from '@/stores/authStore'

// WebSocket URL with relative path
const WS_URL = '/ws'

// Singleton WebSocket client
let stompClient: any = null
let stompSubscriptions: any[] = []

// Connection state management
const isConnected = ref(false)
const isConnecting = ref(false)
const isReconnecting = ref(false)
let reconnectAttempts = 0
const maxReconnectAttempts = 5
let reconnectTimeout: any = null
let connectionTimeoutHandle: any = null

// Heartbeat configuration (ms)
const heartbeatOutgoing = 10_000 // Send heartbeat every 10s
const heartbeatIncoming = 10_000 // Expect heartbeat every 10s

// Connection timeout (ms)
const connectionTimeout = 30_000 // Increased to 30 seconds

export const websocketService = {
  /**
   * Get connection status
   */
  getConnectionStatus () {
    return {
      isConnected: isConnected.value,
      isConnecting: isConnecting.value,
      isReconnecting: isReconnecting.value,
    }
  },

  /**
   * Connect to WebSocket and include authentication
   */
  connect () {
    console.log('[websocketService] Attempting to connect...')

    if (isConnecting.value) {
      console.log('[websocketService] Connection attempt already in progress')
      return Promise.reject(new Error('Connection attempt already in progress'))
    }

    if (isConnected.value && stompClient?.connected) {
      console.log('[websocketService] Already connected')
      return Promise.resolve()
    }

    isConnecting.value = true

    // Clear any existing timeout
    if (connectionTimeoutHandle) {
      clearTimeout(connectionTimeoutHandle)
      connectionTimeoutHandle = null
    }

    // Close any existing connection
    this.disconnect(false) // Don't reset connection flags

    console.log(`[websocketService] Creating SockJS connection to: ${WS_URL}`)
    const socket = new SockJS(WS_URL)

    // Track socket opened state
    let socketOpened = false

    // Add SockJS event listeners for low-level debugging
    socket.addEventListener('open', () => {
      console.log('>>> SockJS: Connection opened <<<')
      socketOpened = true

      // Consider connected at socket level even if STOMP handshake isn't complete
      if (!isConnected.value) {
        console.log('>>> SockJS: Socket connection established, marking as connected <<<')
        isConnected.value = true
        isConnecting.value = false
      }
    })

    socket.onmessage = (e: any) => {
      console.log('>>> SockJS: Message received <<<', e.data)
      // Update connection status when messages are coming through
      if (!isConnected.value) {
        console.log('>>> SockJS: Setting isConnected to true since messages are flowing <<<')
        isConnected.value = true
        isConnecting.value = false
      }
    }

    socket.addEventListener('close', (event: any) => {
      console.log('>>> SockJS: Connection closed <<<', event)

      // Only schedule reconnect if socket was previously opened
      // This prevents reconnect attempts for initial connection failures
      if (isConnected.value || socketOpened) {
        isConnected.value = false
        this.scheduleReconnect()
      }
    })

    socket.onerror = (error: any) => {
      console.error('>>> SockJS: Error <<<', error)
    }

    console.log('[websocketService] Creating STOMP client over SockJS')
    // Explicitly set STOMP protocols and disable heartbeating at STOMP level
    // Let SockJS handle connection state
    stompClient = Stomp.over(socket, {
      protocols: ['v12.stomp'],
      heartbeat: false, // Disable STOMP heartbeats, we'll rely on SockJS
    })

    // Enable Stomp client debugging
    stompClient.debug = (str: string) => {
      console.log('STOMP DEBUG:', str)

      // Set connected status when heartbeats or CONNECTED frames are received
      if ((str.includes('<<heart-beat>>') || str.includes('connected to server') || str.includes('CONNECTED')) && !isConnected.value) {
        console.log('>>> STOMP: Connection detected via debug message, setting isConnected to true <<<')
        isConnected.value = true
        isConnecting.value = false
      }
    }
    console.log('[websocketService] STOMP client created and debug enabled.')

    // Get authentication info
    const token = localStorage.getItem('user_token')
    const authStore = useAuthStore()
    const user = authStore.currentUser

    // Prepare headers with authentication info
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (user?.username) {
      headers['username'] = user.username
    }

    // Configure heartbeating
    headers['heart-beat'] = `${heartbeatOutgoing},${heartbeatIncoming}`

    const connectPromise = new Promise<void>((resolve, reject) => {
      console.log('[websocketService] Calling stompClient.connect() with headers:', headers)

      // Set a manual timeout that will be cleared on successful connection
      connectionTimeoutHandle = setTimeout(() => {
        console.error(`>>> STOMP: Connection attempt timed out after ${connectionTimeout / 1000} seconds <<<`)
        // If socket is open but STOMP handshake isn't complete, we can still consider it connected
        if (socketOpened) {
          console.log('>>> STOMP: Socket is open but STOMP handshake timed out. Marking as connected anyway <<<')
          isConnected.value = true
          isConnecting.value = false
          resolve() // Resolve promise despite STOMP timeout
        } else {
          isConnecting.value = false
          if (isReconnecting.value) {
            this.scheduleReconnect()
          }
          reject(new Error(`STOMP connection attempt timed out after ${connectionTimeout / 1000} seconds`))
        }
      }, connectionTimeout)

      stompClient.connect(
        headers,
        () => {
          console.log('>>> STOMP: Connected successfully <<<')
          console.log('WebSocket connected successfully')

          // Clear the timeout since we connected successfully
          if (connectionTimeoutHandle) {
            clearTimeout(connectionTimeoutHandle)
            connectionTimeoutHandle = null
          }

          isConnected.value = true
          isConnecting.value = false
          isReconnecting.value = false
          reconnectAttempts = 0
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
          resolve()
        },
        (error: any) => {
          console.error('>>> STOMP: Connection error <<<', error)
          console.error('WebSocket connection error object:', error)

          // Don't immediately mark as disconnected if socket is open
          // This allows messages to flow even if STOMP reports errors
          if (socketOpened) {
            console.log('>>> STOMP: Connection error but socket is open, maintaining connection <<<')
            isConnected.value = true
            isConnecting.value = false
            resolve() // Resolve despite the error
          } else {
            isConnecting.value = false
            isConnected.value = false

            if (isReconnecting.value) {
              this.scheduleReconnect()
            }
            reject(error)
          }
        },
      )
    })

    return connectPromise
  },

  /**
   * Schedule a reconnect attempt with exponential backoff
   */
  scheduleReconnect () {
    if (reconnectTimeout || reconnectAttempts >= maxReconnectAttempts) {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log(`[websocketService] Max reconnect attempts (${maxReconnectAttempts}) reached`)
        isReconnecting.value = false
      }
      return
    }

    isReconnecting.value = true
    const delay = Math.min(1000 * (2 ** reconnectAttempts), 30_000) // Max 30s delay
    console.log(`[websocketService] Scheduling reconnect attempt ${reconnectAttempts + 1} in ${delay}ms`)

    reconnectTimeout = setTimeout(() => {
      reconnectAttempts++
      reconnectTimeout = null
      console.log(`[websocketService] Attempting reconnect #${reconnectAttempts}`)
      this.connect().catch(() => {
        console.log('[websocketService] Reconnect attempt failed')
      })
    }, delay)
  },

  /**
   * Disconnect from WebSocket
   */
  disconnect (resetFlags = true) {
    if (stompClient && stompClient.connected) {
      // Unsubscribe from all topics
      for (const sub of stompSubscriptions) {
        try {
          sub.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing:', error)
        }
      }
      stompSubscriptions = []

      // Disconnect the client
      try {
        stompClient.disconnect(() => {
          console.log('[websocketService] Disconnected successfully')
        })
      } catch (error) {
        console.error('Error disconnecting:', error)
      }
    }

    if (resetFlags) {
      isConnected.value = false
      isConnecting.value = false
      isReconnecting.value = false

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      reconnectAttempts = 0
    }
  },

  /**
   * Subscribe to a destination
   */
  subscribe (destination: string, callback: (message: any) => void) {
    // Allow subscription attempts even if STOMP client reports not connected
    // As long as the socket is open (isConnected=true)
    if (!stompClient) {
      throw new Error('No STOMP client available')
    }

    try {
      // Try to subscribe even if STOMP reports not connected
      // This works in many cases where the socket is open but STOMP thinks it's disconnected
      const subscription = stompClient.subscribe(destination, (message: any) => {
        // If we can subscribe and receive messages, we're definitely connected
        if (!isConnected.value) {
          console.log(`>>> STOMP: Subscription to ${destination} working, setting isConnected to true <<<`)
          isConnected.value = true
          isConnecting.value = false
        }

        try {
          const parsedBody = JSON.parse(message.body)
          callback(parsedBody)
        } catch (error) {
          console.error(`Error parsing message from ${destination}:`, error)
          callback(message.body) // Pass raw message if parsing fails
        }
      })

      // Store subscription for later cleanup
      stompSubscriptions.push(subscription)
      return subscription
    } catch (error) {
      console.error(`Error subscribing to ${destination}:`, error)

      // Schedule a retry for subscriptions
      setTimeout(() => {
        console.log(`Retrying subscription to ${destination}...`)
        // Try to reconnect first
        this.connect().then(() => {
          this.subscribe(destination, callback)
        }).catch(() => {})
      }, 2000)

      // Return a dummy subscription that can be safely "unsubscribed"
      return {
        id: 'pending-' + Date.now(),
        unsubscribe: () => {},
      }
    }
  },

  /**
   * Send message to a destination
   */
  send (destination: string, body: any) {
    if (!stompClient) {
      console.error('[websocketService] No STOMP client available')
      return false
    }

    if (!stompClient.connected) {
      console.error('[websocketService] STOMP client not connected')
      isConnected.value = false
      // Try to reconnect
      this.connect().catch(() => {})
      return false
    }

    try {
      stompClient.send(destination, JSON.stringify(body))
      return true
    } catch (error) {
      console.error('[websocketService] Error sending message:', error)
      return false
    }
  },

  /**
   * Get client instance
   */
  getClient () {
    return stompClient
  },
}
