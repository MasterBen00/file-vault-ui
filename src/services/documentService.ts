import axios from 'axios'
import { computed, ref } from 'vue'
import { websocketService } from '@/services/websocketService'
import { useAuthStore } from '@/stores/authStore'

// API base URL - relative path to work with Vite proxy
const API_URL = '/api'

// Type definitions
export interface Document {
  id: string
  name: string
  content: string
  ownerUsername: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  versionId: string
  documentId: string
  content: string
  createdBy: string
  createdAt: string
}

export interface DocumentShareRequest {
  shareWithUsername: string
  permissionLevel: 'VIEW' | 'EDIT'
}

export interface DocumentShare {
  documentId: string
  sharedWithUsername: string
  permissionLevel: string
  sharedBy: string
  sharedAt: string
}

interface DocumentContentUpdate {
  documentId: string
  content: string
  updatedBy?: string
}

export interface UserTypingStatus {
  username: string
  isTyping?: boolean
  typing?: boolean // Server might use 'typing' instead of 'isTyping'
  documentId?: string
}

/**
 * Helper function to create a debounced version of a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any> (fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  return (...args: Parameters<T>): void => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(() => {
      fn(...args)
      timeout = null
    }, delay)
  }
}

/**
 * Document service for managing documents and their sharing
 */
export const documentService = {
  /**
   * Document CRUD operations
   */
  createDocument: async (name: string, content = '') => {
    const response = await axios.post(`${API_URL}/documents`, { name, content })
    return response.data
  },

  getDocumentById: async (documentId: string) => {
    const response = await axios.get(`${API_URL}/documents/${documentId}`)
    return response.data
  },

  updateDocumentContent: async (documentId: string, content: string) => {
    const response = await axios.put(`${API_URL}/documents/${documentId}`, content, {
      headers: { 'Content-Type': 'text/plain' },
    })
    return response.data
  },

  getMyDocuments: async () => {
    const response = await axios.get(`${API_URL}/documents/my-documents`)
    return response.data
  },

  getDocumentVersions: async (documentId: string) => {
    const response = await axios.get(`${API_URL}/documents/${documentId}/versions`)
    return response.data
  },

  /**
   * Document sharing operations
   */
  shareDocument: async (documentId: string, shareWithUsername: string, permissionLevel: 'VIEW' | 'EDIT' = 'EDIT') => {
    const shareRequest: DocumentShareRequest = { shareWithUsername, permissionLevel }
    const response = await axios.post(`${API_URL}/documents/${documentId}/share`, shareRequest)
    return response.data as DocumentShare
  },

  revokeSharing: async (documentId: string, username: string) => {
    await axios.delete(`${API_URL}/documents/${documentId}/share/${username}`)
  },

  getSharedUsers: async (documentId: string) => {
    const response = await axios.get(`${API_URL}/documents/${documentId}/shares`)
    return response.data as DocumentShare[]
  },

  getSharedWithMe: async () => {
    const response = await axios.get(`${API_URL}/documents/shared-with-me`)
    return response.data as Document[]
  },

  /**
   * WebSocket communication for real-time collaboration
   */
  connectToDocument: async (
    documentId: string,
    onContentUpdate: (update: DocumentContentUpdate) => void,
    onTypingUpdate: (status: UserTypingStatus[]) => void,
  ) => {
    // Ensure there's an active connection first
    await websocketService.connect()

    // Subscribe to document content updates
    websocketService.subscribe(`/topic/docs/${documentId}`, (update: DocumentContentUpdate) => {
      onContentUpdate(update)
    })

    // Subscribe to typing status updates
    websocketService.subscribe(`/topic/docs/${documentId}/typing`, (typingStatus: UserTypingStatus) => {
      // Skip processing if this is our own typing status
      const currentUsername = useAuthStore().currentUser?.username
      if (typingStatus.username === currentUsername) {
        console.log('Ignoring own typing status reflected back:', typingStatus)
        return
      }

      // Normalize the typing status
      const normalizedStatus: UserTypingStatus = {
        username: typingStatus.username,
        isTyping: typingStatus.isTyping === undefined ? typingStatus.typing || false : typingStatus.isTyping,
        documentId,
      }

      // Send to handler
      onTypingUpdate([normalizedStatus])
    })
  },

  disconnectFromDocument: () => {
    websocketService.disconnect()
  },

  sendDocumentUpdate: (documentId: string, content: string) => {
    const update: DocumentContentUpdate = {
      documentId,
      content,
      updatedBy: useAuthStore().currentUser?.username,
    }
    return websocketService.send(`/app/docs/${documentId}/update`, update)
  },

  sendTypingStatus: (documentId: string, isTyping: boolean) => {
    // Format to match what server expects (typing instead of isTyping)
    const status = {
      typing: isTyping,
      username: useAuthStore().currentUser?.username,
      documentId,
    }
    return websocketService.send(`/app/docs/${documentId}/typing`, status)
  },
}

/**
 * Composable for collaborative document editing
 * @param documentId The ID of the document to edit collaboratively
 */
export function useCollaborativeEditing (documentId: string) {
  // State management
  const document = ref<Document | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const activeUsers = ref<UserTypingStatus[]>([])
  const localTypingState = ref(false)

  // Timers
  let typingTimer: number | null = null
  let heartbeatInterval: number | null = null
  let connectionCheckInterval: number | null = null

  // Get connection status from websocket service
  const connectionStatus = computed(() => websocketService.getConnectionStatus())
  const isConnected = computed(() => connectionStatus.value.isConnected)
  const isReconnecting = computed(() => connectionStatus.value.isReconnecting)

  /**
   * Load document data from the server
   */
  const loadDocument = async () => {
    isLoading.value = true
    error.value = null

    try {
      document.value = await documentService.getDocumentById(documentId)
    } catch (error_: any) {
      error.value = error_.message || 'Failed to load document'
      console.error('Error loading document:', error_)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Start sending periodic typing status updates
   */
  const startTypingHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }

    // Send initial typing status
    documentService.sendTypingStatus(documentId, true)

    // Send periodic updates every 2 seconds while typing
    heartbeatInterval = window.setInterval(() => {
      if (localTypingState.value) {
        documentService.sendTypingStatus(documentId, true)
      } else {
        stopTypingHeartbeat()
      }
    }, 2000)
  }

  /**
   * Stop sending typing status updates
   */
  const stopTypingHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }

    // Send final typing=false status
    if (localTypingState.value) {
      localTypingState.value = false
      documentService.sendTypingStatus(documentId, false)
    }
  }

  /**
   * Update document content locally or handle remote updates
   */
  const updateContent = (content: string, fromRemote = false) => {
    if (!document.value) {
      return
    }

    document.value.content = content

    // Only trigger typing state for local updates
    if (!fromRemote) {
      // Set local typing state to true
      localTypingState.value = true

      // Start/refresh typing heartbeat
      startTypingHeartbeat()

      // Reset inactivity timer
      if (typingTimer) {
        clearTimeout(typingTimer)
      }

      // Auto-clear typing status after inactivity
      typingTimer = window.setTimeout(() => {
        stopTypingHeartbeat()
      }, 3000)
    }
  }

  /**
   * Handle typing events from the UI
   */
  const onStartTyping = () => {
    if (!localTypingState.value) {
      localTypingState.value = true
      startTypingHeartbeat()
    }
  }

  const onStopTyping = () => {
    stopTypingHeartbeat()
  }

  /**
   * Send document updates with debouncing
   */
  const debouncedSendUpdate = debounce((content: string) => {
    // If we successfully send an update, that's proof of connection
    const success = documentService.sendDocumentUpdate(documentId, content)
    if (success && !isConnected.value) {
      console.log('Document update sent successfully, connection is working')
    }
  }, 500)

  /**
   * Handle document content updates from WebSocket
   */
  const handleContentUpdate = (update: DocumentContentUpdate) => {
    // If we're receiving updates, we're definitely connected
    if (!isConnected.value) {
      console.log('Received document update, setting connection status to connected')
    }

    if (update.content !== undefined) {
      updateContent(update.content, true)
    }
  }

  /**
   * Process typing status updates from other users
   */
  const handleTypingUpdate = (statuses: UserTypingStatus[]) => {
    // If we're receiving typing updates, we're definitely connected
    if (!isConnected.value) {
      console.log('Received typing update, setting connection status to connected')
    }

    // Filter out current user's status
    const filteredStatuses = statuses.filter(
      status => status.username !== useAuthStore().currentUser?.username,
    )

    if (filteredStatuses.length === 0) {
      return
    }

    // Merge new statuses with existing ones
    const updatedUsers = [...activeUsers.value]

    for (const newStatus of filteredStatuses) {
      // Normalize typing status
      const isTyping = newStatus.isTyping === undefined ? newStatus.typing || false : newStatus.isTyping

      // Find if user already exists in the list
      const existingIndex = updatedUsers.findIndex(user => user.username === newStatus.username)
      const normalizedStatus = { username: newStatus.username, isTyping }

      if (existingIndex === -1 && isTyping) {
        // Add new typing user
        updatedUsers.push(normalizedStatus)
      } else if (existingIndex !== -1) {
        if (isTyping) {
          // Update existing user's status
          updatedUsers[existingIndex] = normalizedStatus
        } else {
          // Remove user when they stop typing
          updatedUsers.splice(existingIndex, 1)
        }
      }
    }

    // Update reactive array
    activeUsers.value = [...updatedUsers]
  }

  /**
   * Connect to document WebSocket channels
   */
  const connect = async () => {
    try {
      await documentService.connectToDocument(
        documentId,
        handleContentUpdate,
        handleTypingUpdate,
      )

      // Add a periodic connection check that can confirm our connection is working
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }

      connectionCheckInterval = window.setInterval(() => {
        // Send a small ping to check connection is active
        // This is a lightweight message that won't affect document content
        documentService.sendTypingStatus(documentId, localTypingState.value)
      }, 5000) // Check every 5 seconds
    } catch (error_: any) {
      error.value = 'Failed to connect to document session'
      console.error('Connection error:', error_)
    }
  }

  /**
   * Disconnect from document WebSocket channels
   */
  const disconnect = () => {
    stopTypingHeartbeat()

    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }

    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
      connectionCheckInterval = null
    }

    documentService.disconnectFromDocument()
  }

  // Initialize
  loadDocument()
  connect()

  // Expose composable API
  return {
    // State
    document,
    isLoading,
    error,
    activeUsers,
    isConnected,
    isReconnecting,

    // Methods
    loadDocument,
    updateContent,
    debouncedSendUpdate,
    connect,
    disconnect,
    onStartTyping,
    onStopTyping,
  }
}
