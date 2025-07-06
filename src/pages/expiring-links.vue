<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 my-4">Expiring Download Links</h1>
        <p class="text-body-1 mb-4">
          Manage expired files, redownload requests, and control file expiration settings.
        </p>

        <!-- Tab Navigation -->
        <v-tabs
          v-model="activeTab"
          bg-color="primary"
          class="mb-6"
        >
          <v-tab value="myExpiredUploads">My Expired Files</v-tab>
          <v-tab value="expiredShared">Expired Shared With Me</v-tab>
          <v-tab value="pendingRequests">Pending Redownload Requests</v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- My Expired Files Tab -->
          <v-window-item value="myExpiredUploads">
            <v-card>
              <v-card-title class="d-flex align-center">
                My Expired Files
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="isLoadingMyExpiredUploads"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="fetchMyExpiredUploads"
                >
                  Refresh
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-alert v-if="myExpiredUploadsError" class="mb-3" type="error">
                  {{ myExpiredUploadsError }}
                </v-alert>

                <div v-if="isLoadingMyExpiredUploads" class="d-flex justify-center">
                  <v-progress-circular indeterminate />
                </div>

                <v-alert v-else-if="myExpiredUploads.length === 0" type="info">
                  You don't have any expired files.
                </v-alert>

                <v-table v-else>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Uploaded</th>
                      <th>Expired</th>
                      <th>Downloads</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="file in myExpiredUploads" :key="file.id">
                      <td>{{ file.originalFileName }}</td>
                      <td>{{ formatDate(file.uploadTime) }}</td>
                      <td>{{ formatDate(file.expiryTime) }}</td>
                      <td>{{ file.downloadCount }}/{{ file.maxDownloads }}</td>
                      <td>
                        <v-chip
                          :color="file.hasRequestedRedownload ? 'warning' : 'error'"
                          size="small"
                          :text="file.hasRequestedRedownload ? 'Redownload Requested' : 'Expired'"
                        />
                      </td>
                      <td>
                        <v-btn
                          class="mr-1"
                          color="primary"
                          size="small"
                          @click="openExtendDialog(file)"
                        >
                          Extend
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Expired Files Shared With Me Tab -->
          <v-window-item value="expiredShared">
            <v-card>
              <v-card-title class="d-flex align-center">
                Expired Files Shared With Me
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="isLoadingExpiredShared"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="fetchExpiredFilesSharedWithMe"
                >
                  Refresh
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-alert v-if="expiredSharedError" class="mb-3" type="error">
                  {{ expiredSharedError }}
                </v-alert>

                <div v-if="isLoadingExpiredShared" class="d-flex justify-center">
                  <v-progress-circular indeterminate />
                </div>

                <v-alert v-else-if="expiredSharedFiles.length === 0" type="info">
                  You don't have any expired files that were shared with you.
                </v-alert>

                <v-table v-else>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Uploaded By</th>
                      <th>Uploaded</th>
                      <th>Expired</th>
                      <th>Downloads</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="file in expiredSharedFiles" :key="file.id">
                      <td>{{ file.originalFileName }}</td>
                      <td>{{ file.uploaderUsername }}</td>
                      <td>{{ formatDate(file.uploadTime) }}</td>
                      <td>{{ formatDate(file.expiryTime) }}</td>
                      <td>{{ file.downloadCount }}/{{ file.maxDownloads }}</td>
                      <td>
                        <v-chip
                          :color="file.hasRequestedRedownload ? 'warning' : 'error'"
                          size="small"
                          :text="file.hasRequestedRedownload ? 'Redownload Requested' : 'Expired'"
                        />
                      </td>
                      <td>
                        <v-btn
                          color="primary"
                          :disabled="file.hasRequestedRedownload"
                          size="small"
                          @click="openRequestRedownloadDialog(file)"
                        >
                          Request Redownload
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Pending Redownload Requests Tab -->
          <v-window-item value="pendingRequests">
            <v-card>
              <v-card-title class="d-flex align-center">
                Pending Redownload Requests
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="isLoadingPendingRequests"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="fetchPendingRedownloadRequests"
                >
                  Refresh
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-alert v-if="pendingRequestsError" class="mb-3" type="error">
                  {{ pendingRequestsError }}
                </v-alert>

                <div v-if="isLoadingPendingRequests" class="d-flex justify-center">
                  <v-progress-circular indeterminate />
                </div>

                <v-alert v-else-if="pendingRequests.length === 0" type="info">
                  There are no pending redownload requests for your files.
                </v-alert>

                <v-table v-else>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Requested By</th>
                      <th>Request Time</th>
                      <th>Expired</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="file in pendingRequests" :key="file.id">
                      <td>{{ file.originalFileName }}</td>
                      <td>{{ file.redownloadRequestedBy }}</td>
                      <td>{{ formatDate(file.redownloadRequestTime) }}</td>
                      <td>{{ formatDate(file.expiryTime) }}</td>
                      <td>
                        <v-btn
                          class="mr-1"
                          color="success"
                          size="small"
                          @click="openApproveRequestDialog(file)"
                        >
                          Approve
                        </v-btn>
                        <v-btn
                          color="error"
                          size="small"
                          @click="openRejectRequestDialog(file)"
                        >
                          Reject
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <!-- Extend File Dialog -->
    <v-dialog v-model="extendDialog" max-width="500px">
      <v-card>
        <v-card-title>Extend File Expiry</v-card-title>
        <v-card-text>
          <p class="mb-2">File: <strong>{{ selectedFile?.originalFileName }}</strong></p>
          <p class="mb-4">Current Expiry: {{ selectedFile ? formatDate(selectedFile.expiryTime) : '' }}</p>

          <v-select
            v-model="extensionTime"
            item-title="text"
            item-value="value"
            :items="extensionOptions"
            label="Extension Period"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" @click="extendDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!extensionTime"
            :loading="isProcessing"
            @click="extendFileExpiry"
          >
            Extend
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Request Redownload Dialog -->
    <v-dialog v-model="requestRedownloadDialog" max-width="500px">
      <v-card>
        <v-card-title>Request File Redownload</v-card-title>
        <v-card-text>
          <p class="mb-4">File: <strong>{{ selectedFile?.originalFileName }}</strong></p>
          <v-textarea
            v-model="requestMessage"
            label="Reason for Request (optional)"
            placeholder="Please explain why you need access to this file again"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" @click="requestRedownloadDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="isProcessing"
            @click="submitRedownloadRequest"
          >
            Submit Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Approve Request Dialog -->
    <v-dialog v-model="approveRequestDialog" max-width="500px">
      <v-card>
        <v-card-title>Approve Redownload Request</v-card-title>
        <v-card-text>
          <p class="mb-2">File: <strong>{{ selectedFile?.originalFileName }}</strong></p>
          <p class="mb-2">Requested By: <strong>{{ selectedFile?.redownloadRequestedBy }}</strong></p>

          <v-select
            v-model="extensionTime"
            item-title="text"
            item-value="value"
            :items="extensionOptions"
            label="Extension Period"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" @click="approveRequestDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            :disabled="!extensionTime"
            :loading="isProcessing"
            @click="approveRedownloadRequest"
          >
            Approve Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Request Dialog -->
    <v-dialog v-model="rejectRequestDialog" max-width="500px">
      <v-card>
        <v-card-title>Reject Redownload Request</v-card-title>
        <v-card-text>
          <p class="mb-2">File: <strong>{{ selectedFile?.originalFileName }}</strong></p>
          <p class="mb-4">Requested By: <strong>{{ selectedFile?.redownloadRequestedBy }}</strong></p>

          <v-textarea
            v-model="rejectionMessage"
            label="Rejection Reason (optional)"
            placeholder="Explain why you're denying the redownload request"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" @click="rejectRequestDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isProcessing"
            @click="rejectRedownloadRequest"
          >
            Reject Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Status Message -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn
          variant="text"
          @click="showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import axios from 'axios'
  import { onMounted, ref } from 'vue'
  import { useAuthStore } from '@/stores/authStore'

  // Auth store
  const authStore = useAuthStore()

  // Tab control
  const activeTab = ref('myExpiredUploads')

  // File lists
  const myExpiredUploads = ref<any[]>([])
  const expiredSharedFiles = ref<any[]>([])
  const pendingRequests = ref<any[]>([])

  // Loading states
  const isLoadingMyExpiredUploads = ref(false)
  const isLoadingExpiredShared = ref(false)
  const isLoadingPendingRequests = ref(false)
  const isProcessing = ref(false)

  // Error states
  const myExpiredUploadsError = ref('')
  const expiredSharedError = ref('')
  const pendingRequestsError = ref('')

  // Dialog controls
  const extendDialog = ref(false)
  const requestRedownloadDialog = ref(false)
  const approveRequestDialog = ref(false)
  const rejectRequestDialog = ref(false)

  // Form data
  const selectedFile = ref<any>(null)
  const extensionTime = ref<number>(1440) // Default to 24 hours
  const requestMessage = ref('')
  const rejectionMessage = ref('')

  // Extension options (in minutes)
  const extensionOptions = [
    { text: '24 hours', value: 1440 },
    { text: '48 hours', value: 2880 },
    { text: '1 week', value: 10_080 },
    { text: '2 weeks', value: 20_160 },
    { text: '30 days', value: 43_200 },
  ]

  // Snackbar
  const showSnackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('success')

  // Data fetching functions
  const fetchMyExpiredUploads = async () => {
    isLoadingMyExpiredUploads.value = true
    myExpiredUploadsError.value = ''

    try {
      const response = await axios.get('/api/files/expired/my-uploads', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      myExpiredUploads.value = response.data
    } catch (error: any) {
      console.error('Failed to fetch expired uploads:', error)
      myExpiredUploadsError.value = error.response?.data?.error || 'Failed to load expired files'
    } finally {
      isLoadingMyExpiredUploads.value = false
    }
  }

  const fetchExpiredFilesSharedWithMe = async () => {
    isLoadingExpiredShared.value = true
    expiredSharedError.value = ''

    try {
      const response = await axios.get('/api/files/expired/shared-with-me', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      expiredSharedFiles.value = response.data
    } catch (error: any) {
      console.error('Failed to fetch expired shared files:', error)
      expiredSharedError.value = error.response?.data?.error || 'Failed to load expired shared files'
    } finally {
      isLoadingExpiredShared.value = false
    }
  }

  const fetchPendingRedownloadRequests = async () => {
    isLoadingPendingRequests.value = true
    pendingRequestsError.value = ''

    try {
      const response = await axios.get('/api/files/expired/redownload-requests', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      pendingRequests.value = response.data
    } catch (error: any) {
      console.error('Failed to fetch pending redownload requests:', error)
      pendingRequestsError.value = error.response?.data?.error || 'Failed to load pending requests'
    } finally {
      isLoadingPendingRequests.value = false
    }
  }

  // UI Helper Functions
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const showMessage = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
    snackbarMessage.value = message
    snackbarColor.value = color
    showSnackbar.value = true
  }

  // Action Functions
  const openExtendDialog = (file: any) => {
    selectedFile.value = file
    extensionTime.value = 1440 // Reset to default
    extendDialog.value = true
  }

  const openRequestRedownloadDialog = (file: any) => {
    selectedFile.value = file
    requestMessage.value = '' // Reset
    requestRedownloadDialog.value = true
  }

  const openApproveRequestDialog = (file: any) => {
    selectedFile.value = file
    extensionTime.value = 1440 // Reset to default
    approveRequestDialog.value = true
  }

  const openRejectRequestDialog = (file: any) => {
    selectedFile.value = file
    rejectionMessage.value = '' // Reset
    rejectRequestDialog.value = true
  }

  // API Action Functions
  const extendFileExpiry = async () => {
    if (!selectedFile.value || !extensionTime.value) return

    isProcessing.value = true
    try {
      const response = await axios.post(
        `/api/files/${selectedFile.value.id}/extend?extensionMinutes=${extensionTime.value}`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      showMessage(`Expiry extended successfully to ${formatDate(response.data.expiryTime)}`)
      extendDialog.value = false
      await fetchMyExpiredUploads() // Refresh the list
    } catch (error: any) {
      console.error('Failed to extend file expiry:', error)
      showMessage(error.response?.data?.error || 'Failed to extend file expiry', 'error')
    } finally {
      isProcessing.value = false
    }
  }

  const submitRedownloadRequest = async () => {
    if (!selectedFile.value) return

    isProcessing.value = true
    try {
      await axios.post(
        `/api/files/expired/request-redownload/${selectedFile.value.id}`,
        { requestMessage: requestMessage.value },
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      showMessage('Redownload request submitted successfully')
      requestRedownloadDialog.value = false
      await fetchExpiredFilesSharedWithMe() // Refresh the list
    } catch (error: any) {
      console.error('Failed to submit redownload request:', error)
      showMessage(error.response?.data?.error || 'Failed to submit redownload request', 'error')
    } finally {
      isProcessing.value = false
    }
  }

  const approveRedownloadRequest = async () => {
    if (!selectedFile.value || !extensionTime.value) return

    isProcessing.value = true
    try {
      await axios.post(
        `/api/files/expired/approve-redownload/${selectedFile.value.id}?extensionMinutes=${extensionTime.value}`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      showMessage('Redownload request approved successfully')
      approveRequestDialog.value = false
      await fetchPendingRedownloadRequests() // Refresh the list
    } catch (error: any) {
      console.error('Failed to approve redownload request:', error)
      showMessage(error.response?.data?.error || 'Failed to approve redownload request', 'error')
    } finally {
      isProcessing.value = false
    }
  }

  const rejectRedownloadRequest = async () => {
    if (!selectedFile.value) return

    isProcessing.value = true
    const queryParams = rejectionMessage.value
      ? `?rejectionMessage=${encodeURIComponent(rejectionMessage.value)}`
      : ''

    try {
      await axios.post(
        `/api/files/expired/reject-redownload/${selectedFile.value.id}${queryParams}`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      showMessage('Redownload request rejected')
      rejectRequestDialog.value = false
      await fetchPendingRedownloadRequests() // Refresh the list
    } catch (error: any) {
      console.error('Failed to reject redownload request:', error)
      showMessage(error.response?.data?.error || 'Failed to reject redownload request', 'error')
    } finally {
      isProcessing.value = false
    }
  }

  // Load data on component mount
  onMounted(() => {
    if (authStore.isAuthenticated) {
      fetchMyExpiredUploads()
      fetchExpiredFilesSharedWithMe()
      fetchPendingRedownloadRequests()
    }
  })

  // Watch for auth changes
  authStore.$subscribe(() => {
    if (authStore.isAuthenticated) {
      fetchMyExpiredUploads()
      fetchExpiredFilesSharedWithMe()
      fetchPendingRedownloadRequests()
    }
  })
</script>

<style scoped>
.v-table {
  width: 100%;
}
</style>
