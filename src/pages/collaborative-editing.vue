<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 my-4">Real-Time Collaborative Document Editing</h1>
        <p class="text-body-1 mb-4">
          Work together on documents in real-time with integrated collaborative editing tools.
        </p>

        <!-- Document Selection and Creation -->
        <v-card class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>My Documents</span>
            <v-btn color="primary" @click="showNewDocumentDialog = true">
              <v-icon start>mdi-file-plus</v-icon>
              New Document
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-tabs v-model="activeTab">
              <v-tab value="owned">My Documents</v-tab>
              <v-tab value="shared">Shared With Me</v-tab>
            </v-tabs>

            <v-window v-model="activeTab" class="mt-4">
              <v-window-item value="owned">
                <v-list v-if="myDocuments.length > 0">
                  <v-list-item
                    v-for="doc in myDocuments"
                    :key="doc.id"
                    :subtitle="'Last updated: ' + formatDate(doc.updatedAt)"
                    :title="doc.name"
                    @click="openDocument(doc.id)"
                  >
                    <template #prepend>
                      <v-icon>mdi-file-document</v-icon>
                    </template>
                    <template #append>
                      <v-btn icon size="small" @click.stop="shareDocument(doc.id)">
                        <v-icon>mdi-share</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-else text="You don't have any documents yet. Create one to get started!" type="info" />
              </v-window-item>

              <v-window-item value="shared">
                <v-list v-if="sharedDocuments.length > 0">
                  <v-list-item
                    v-for="doc in sharedDocuments"
                    :key="doc.id"
                    :subtitle="'Owned by: ' + doc.ownerUsername"
                    :title="doc.name"
                    @click="openDocument(doc.id)"
                  >
                    <template #prepend>
                      <v-icon>mdi-file-document-multiple</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-else text="No documents have been shared with you." type="info" />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>

        <!-- Document Editor -->
        <v-card v-if="selectedDocumentId" class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <span>{{ currentDocument?.name || 'Document Editor' }}</span>
              <v-chip v-if="isConnected" class="ml-4" color="success" size="small">Connected</v-chip>
              <v-chip v-else-if="isReconnecting" class="ml-4" color="warning" size="small">Reconnecting...</v-chip>
              <v-chip v-else class="ml-4" color="error" size="small">Disconnected</v-chip>
            </div>
            <div>
              <v-btn class="mr-2" icon @click="showVersionHistory = true">
                <v-icon>mdi-history</v-icon>
              </v-btn>
              <v-btn class="mr-2" icon @click="showShareDialog = true">
                <v-icon>mdi-share</v-icon>
              </v-btn>
              <v-btn icon @click="closeDocument">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </v-card-title>

          <v-divider />

          <!-- Active Users -->
          <div v-if="filteredActiveUsers.length > 0" class="px-4 py-2 bg-grey-lighten-4">
            <span class="mr-2">Currently editing:</span>
            <v-chip
              v-for="user in filteredActiveUsers"
              :key="user.username"
              class="mr-1"
              :class="{ 'active-user': user.isTyping }"
              :color="user.isTyping ? 'primary' : 'grey'"
              size="small"
            >
              {{ user.username }}
            </v-chip>
          </div>

          <v-card-text>
            <v-textarea
              v-model="documentContent"
              auto-grow
              :error-messages="error"
              filled
              label="Document Content"
              :loading="initialLoading && isLoading"
              :readonly="!canEdit"
              rows="15"
              @blur="onStopTyping"
              @focus="onStartTyping"
              @input="onDocumentChange"
            />
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-fade-transition>
              <span v-if="saveStatus === 'saving'" class="text-grey mr-3">Saving...</span>
              <span v-else-if="saveStatus === 'saved'" class="text-success mr-3">Changes saved</span>
              <span v-else-if="saveStatus === 'failed'" class="text-error mr-3">Save failed</span>
              <span v-else-if="!canEdit" class="text-info mr-3">View Only</span>
            </v-fade-transition>
            <v-btn color="primary" :disabled="saveStatus === 'saving' || !canEdit" @click="saveDocument">Save</v-btn>
          </v-card-actions>
        </v-card>

        <!-- Info card when no document is selected -->
        <v-card v-else>
          <v-card-text class="text-center pa-6">
            <v-icon class="mb-4" color="primary" size="64">mdi-file-document-edit</v-icon>
            <h3 class="text-h5 mb-2">Select or Create a Document</h3>
            <p class="text-body-1">
              Choose a document from your list or create a new one to start collaborating.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- New Document Dialog -->
    <v-dialog v-model="showNewDocumentDialog" max-width="500px">
      <v-card>
        <v-card-title>Create New Document</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newDocumentName"
            :error-messages="newDocumentNameError"
            label="Document Name"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="showNewDocumentDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createNewDocument">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share Document Dialog -->
    <v-dialog v-model="showShareDialog" max-width="500px">
      <v-card>
        <v-card-title>Share Document</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="shareUsername"
            :error-messages="shareError"
            label="Username to share with"
            required
          />

          <v-select
            v-model="sharePermissionLevel"
            hint="Choose what the user can do with this document"
            :items="permissionLevels"
            label="Permission Level"
          />

          <v-list v-if="documentShares.length > 0" class="mt-4">
            <v-list-subheader>Currently shared with:</v-list-subheader>
            <v-list-item
              v-for="share in documentShares"
              :key="share.sharedWithUsername"
            >
              <template #prepend>
                <v-icon :color="getPermissionColor(share.permissionLevel)">
                  {{ getPermissionIcon(share.permissionLevel) }}
                </v-icon>
              </template>

              <v-list-item-title>{{ share.sharedWithUsername }}</v-list-item-title>
              <v-list-item-subtitle>
                Permission: {{ share.permissionLevel }}
                <span class="text-caption">
                  (Shared on {{ formatDate(share.sharedAt) }} by {{ share.sharedBy }})
                </span>
              </v-list-item-subtitle>

              <template #append>
                <v-btn color="error" icon size="small" @click="unshareDocument(share.sharedWithUsername)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="showShareDialog = false">Close</v-btn>
          <v-btn color="primary" @click="shareDocumentWithUser">Share</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Version History Dialog -->
    <v-dialog v-model="showVersionHistory" max-width="800px">
      <v-card>
        <v-card-title>Version History</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="versionHistoryHeaders"
            :items="documentVersions"
            :loading="loadingVersions"
          >
            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
            <template #item.actions="{ item }">
              <v-btn icon size="small" @click="viewVersion(item)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showVersionHistory = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Version View Dialog -->
    <v-dialog v-model="showVersionContent" max-width="800px">
      <v-card>
        <v-card-title>
          Version from {{ selectedVersion ? formatDate(selectedVersion.createdAt) : '' }}
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="selectedVersionContent"
            auto-grow
            filled
            readonly
            rows="15"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="restoreVersion">Restore This Version</v-btn>
          <v-btn text @click="showVersionContent = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { documentService, type DocumentShare, useCollaborativeEditing } from '@/services/documentService'
  import { useAuthStore } from '@/stores/authStore.ts'

  // Document lists
  const myDocuments = ref<any[]>([])
  const sharedDocuments = ref<any[]>([])
  const activeTab = ref('owned')

  // Document editing
  const selectedDocumentId = ref<string | null>(null)
  const currentDocument = ref<any | null>(null)
  const documentContent = ref('')
  const isLoading = ref(false)
  const initialLoading = ref(false) // Flag to track initial document loading only
  const error = ref<string | null>(null)
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const activeUsers = ref<any[]>([])
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = ref<number | null>(null)
  const authStore = useAuthStore()
  // User permission for the current document
  const userPermission = ref<'VIEW' | 'EDIT' | 'ADMIN'>('EDIT')
  const canEdit = computed(() => userPermission.value === 'EDIT' || userPermission.value === 'ADMIN')

  // Filter out current user from active users list
  const filteredActiveUsers = computed(() => {
    const currentUsername = authStore.currentUser?.username
    return activeUsers.value.filter(user => user.username !== currentUsername)
  })

  // Version history
  const documentVersions = ref<any[]>([])
  const showVersionHistory = ref(false)
  const loadingVersions = ref(false)
  const versionHistoryHeaders = [
    { title: 'Version ID', key: 'id' },
    { title: 'Created By', key: 'changedByUsername' },
    { title: 'Date', key: 'changedAt' },
    { title: 'Actions', key: 'actions' },
  ]

  // Version viewing
  const showVersionContent = ref(false)
  const selectedVersion = ref<any | null>(null)
  const selectedVersionContent = ref('')

  // New document dialog
  const showNewDocumentDialog = ref(false)
  const newDocumentName = ref('')
  const newDocumentNameError = ref('')

  // Share document dialog
  const showShareDialog = ref(false)
  const shareUsername = ref('')
  const shareError = ref('')
  const sharePermissionLevel = ref<'VIEW' | 'EDIT'>('EDIT')
  const permissionLevels = [
    { title: 'View Only', value: 'VIEW' },
    { title: 'Edit', value: 'EDIT' },
  ]
  const documentShares = ref<DocumentShare[]>([])

  // Document collaboration helpers
  let collaborationHelper: ReturnType<typeof useCollaborativeEditing> | null = null

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString()
  }

  // Load documents
  const loadDocuments = async () => {
    try {
      myDocuments.value = await documentService.getMyDocuments()
      sharedDocuments.value = await documentService.getSharedWithMe()
    } catch (error_) {
      console.error('Error loading documents:', error_)
    }
  }

  // Create new document
  const createNewDocument = async () => {
    newDocumentNameError.value = ''
    if (!newDocumentName.value.trim()) {
      newDocumentNameError.value = 'Document name is required'
      return
    }

    try {
      const newDoc = await documentService.createDocument(newDocumentName.value)
      await loadDocuments()
      showNewDocumentDialog.value = false
      newDocumentName.value = ''
      openDocument(newDoc.id)
    } catch (error_: any) {
      newDocumentNameError.value = error_.message || 'Error creating document'
    }
  }

  // Open document for editing
  const openDocument = async (documentId: string) => {
    // Disconnect from any current document first
    if (collaborationHelper) {
      collaborationHelper.disconnect()
    }

    selectedDocumentId.value = documentId
    isLoading.value = true
    initialLoading.value = true // Set initial loading to true when opening a document
    error.value = null

    try {
      // Initialize collaborative editing
      collaborationHelper = useCollaborativeEditing(documentId)

      // Set up reactive bindings for the collaborative editing state
      currentDocument.value = computed(() => collaborationHelper?.document.value)
      documentContent.value = computed(() => collaborationHelper?.document.value?.content || '').value
      isLoading.value = computed(() => collaborationHelper?.isLoading.value || false).value
      error.value = computed(() => collaborationHelper?.error.value || null).value

      // Clear initial loading flag once document is loaded
      setTimeout(() => {
        initialLoading.value = false
      }, 1000)

      // Important: Set up a direct binding to the activeUsers array from the composable
      activeUsers.value = [] // Reset first

      // Create a watcher to keep the activeUsers array in sync
      watch(
        () => collaborationHelper?.activeUsers.value,
        newActiveUsers => {
          if (newActiveUsers) {
            console.log('Active users updated in component:', newActiveUsers)
            activeUsers.value = [...newActiveUsers] // Create a new array reference to ensure reactivity
          }
        },
        { immediate: true, deep: true },
      )

      // Use reactive connection status from WebSocket service via the collaborationHelper
      // Create watchers to ensure reactivity for connection status
      watch(
        () => collaborationHelper?.isConnected.value,
        newIsConnected => {
          if (newIsConnected !== undefined) {
            console.log('Connection status updated in component:', newIsConnected)
            isConnected.value = newIsConnected
          }
        },
        { immediate: true },
      )

      watch(
        () => collaborationHelper?.isReconnecting.value,
        newIsReconnecting => {
          if (newIsReconnecting !== undefined) {
            console.log('Reconnecting status updated in component:', newIsReconnecting)
            isReconnecting.value = newIsReconnecting
          }
        },
        { immediate: true },
      )

      // Also update connection status when document updates are flowing
      // This is an additional check to ensure UI shows connected when updates are happening
      watch(
        () => documentContent.value,
        () => {
          // If we're getting content updates, we must be connected
          // This helps address the UI showing disconnected when clearly updates are working
          if (!isConnected.value && selectedDocumentId.value) {
            console.log('Document content updated but status shows disconnected. Correcting status.')
            isConnected.value = true
          }
        },
      )

      // Watch for document content changes from the server
      watch(
        () => collaborationHelper?.document.value?.content,
        newContent => {
          if (newContent !== undefined && newContent !== documentContent.value) {
            documentContent.value = newContent
          }
        },
      )

      // Load document shares
      await loadDocumentShares(documentId)

      // Check user permission for this document
      const currentUsername = authStore.currentUser?.username

      // Default to EDIT for documents the user owns
      userPermission.value = 'EDIT'

      // If this is a shared document, check the user's permission
      if (currentDocument.value?.ownerUsername !== currentUsername) {
        const currentUserShare = documentShares.value.find(
          share => share.sharedWithUsername === currentUsername,
        )
        if (currentUserShare) {
          userPermission.value = currentUserShare.permissionLevel as 'VIEW' | 'EDIT' | 'ADMIN'
        }
      }

      console.log(`Document opened with permission: ${userPermission.value}`)
    } catch (error_: any) {
      error.value = error_.message || 'Error opening document'
      console.error('Error opening document:', error_)
    }
  }

  // Attempt to reconnect to WebSocket
  const tryReconnect = () => {
    if (reconnectInterval.value) {
      clearInterval(reconnectInterval.value)
    }

    reconnectInterval.value = window.setInterval(async () => {
      if (!selectedDocumentId.value || isConnected.value || reconnectAttempts.value >= maxReconnectAttempts) {
        if (reconnectInterval.value) {
          clearInterval(reconnectInterval.value)
          reconnectInterval.value = null
        }
        if (reconnectAttempts.value >= maxReconnectAttempts) {
          isReconnecting.value = false
          error.value = 'Failed to reconnect after several attempts.'
        }
        return
      }

      reconnectAttempts.value++
      console.log(`Attempting to reconnect (${reconnectAttempts.value}/${maxReconnectAttempts})...`)

      try {
        if (collaborationHelper) {
          await collaborationHelper.connect()
        }
      } catch (error_) {
        console.error('Reconnection attempt failed:', error_)
      }
    }, 3000) // Try every 3 seconds
  }

  // Close document
  const closeDocument = () => {
    // Cleanup WebSocket connection
    if (collaborationHelper) {
      collaborationHelper.disconnect()
    }

    selectedDocumentId.value = null
    currentDocument.value = null
    documentContent.value = ''
    collaborationHelper = null
  }

  // Handle typing status
  const onStartTyping = () => {
    if (collaborationHelper) {
      collaborationHelper.onStartTyping()
    }
  }

  const onStopTyping = () => {
    if (collaborationHelper) {
      collaborationHelper.onStopTyping()
    }
  }

  // Document editing functions
  const onDocumentChange = () => {
    if (collaborationHelper) {
      // Send updates with debouncing
      collaborationHelper.debouncedSendUpdate(documentContent.value)
      saveStatus.value = 'saving'

      // Set timeout to show "saved" status
      setTimeout(() => {
        saveStatus.value = 'saved'
      }, 800)
    }
  }

  // Save document manually
  const saveDocument = async () => {
    if (!selectedDocumentId.value || !documentContent.value) return

    saveStatus.value = 'saving'

    try {
      // Update content in backend
      await documentService.updateDocumentContent(selectedDocumentId.value, documentContent.value)

      // Also broadcast to other users
      if (collaborationHelper) {
        collaborationHelper.debouncedSendUpdate(documentContent.value)
      }

      saveStatus.value = 'saved'
    } catch (error_) {
      console.error('Error saving document:', error_)
      saveStatus.value = 'failed'
    }
  }

  // Helper functions for permission display
  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'VIEW': { return 'mdi-eye'
      }
      case 'EDIT': { return 'mdi-pencil'
      }
      case 'ADMIN': { return 'mdi-shield-account'
      }
      default: { return 'mdi-help-circle'
      }
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'VIEW': { return 'blue'
      }
      case 'EDIT': { return 'green'
      }
      case 'ADMIN': { return 'purple'
      }
      default: { return 'grey'
      }
    }
  }

  // Document sharing
  const shareDocument = async (documentId: string) => {
    selectedDocumentId.value = documentId
    await loadDocumentShares(documentId)
    shareUsername.value = ''
    sharePermissionLevel.value = 'EDIT'
    showShareDialog.value = true
  }

  const loadDocumentShares = async (documentId: string) => {
    try {
      const shares = await documentService.getSharedUsers(documentId)
      documentShares.value = shares
    } catch (error_) {
      console.error('Error loading document shares:', error_)
    }
  }

  const shareDocumentWithUser = async () => {
    shareError.value = ''
    if (!shareUsername.value.trim()) {
      shareError.value = 'Username is required'
      return
    }

    if (!selectedDocumentId.value) return

    try {
      await documentService.shareDocument(
        selectedDocumentId.value,
        shareUsername.value,
        sharePermissionLevel.value,
      )
      await loadDocumentShares(selectedDocumentId.value)
      shareUsername.value = ''
    } catch (error_: any) {
      shareError.value = error_.message || 'Error sharing document'
    }
  }

  const unshareDocument = async (username: string) => {
    if (!selectedDocumentId.value) return

    try {
      await documentService.revokeSharing(selectedDocumentId.value, username)
      await loadDocumentShares(selectedDocumentId.value)
    } catch (error_) {
      console.error('Error unsharing document:', error_)
    }
  }

  // Version history
  const loadVersionHistory = async () => {
    if (!selectedDocumentId.value) return

    loadingVersions.value = true
    try {
      documentVersions.value = await documentService.getDocumentVersions(selectedDocumentId.value)
    } catch (error_) {
      console.error('Error loading version history:', error_)
    } finally {
      loadingVersions.value = false
    }
  }

  const viewVersion = (version: any) => {
    selectedVersion.value = version
    selectedVersionContent.value = version.content
    showVersionContent.value = true
  }

  const restoreVersion = () => {
    if (selectedVersion.value && collaborationHelper) {
      documentContent.value = selectedVersion.value.content
      collaborationHelper.updateContent(selectedVersion.value.content)
      collaborationHelper.debouncedSendUpdate(selectedVersion.value.content)
      showVersionContent.value = false
    }
  }

  // Lifecycle hooks
  onMounted(async () => {
    await loadDocuments()
  })

  onBeforeUnmount(() => {
    // Cleanup WebSocket connection when component is destroyed
    if (collaborationHelper) {
      collaborationHelper.disconnect()
    }
  })

  // Watch for version history dialog open
  watch(showVersionHistory, show => {
    if (show) {
      loadVersionHistory()
    }
  })
</script>

<style scoped>
/* Document editor enhancements */
.v-textarea :deep(textarea) {
  font-family: 'Roboto Mono', monospace;
  line-height: 1.6;
}

.v-chip.active-user {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
