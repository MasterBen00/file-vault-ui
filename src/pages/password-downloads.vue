<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 my-4">Password Protected Files</h1>
        <p class="text-body-1 mb-4">
          Manage your password-protected files and access files shared with you securely.
        </p>

        <!-- Navigation Tabs -->
        <v-tabs
          v-model="activeTab"
          bg-color="primary"
          class="mb-6"
        >
          <v-tab value="myUploads">My Protected Files</v-tab>
          <v-tab value="sharedWithMe">Shared With Me</v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- My Protected Files Tab -->
          <v-window-item value="myUploads">
            <v-card>
              <v-card-title class="d-flex align-center">
                My Password Protected Files
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="isLoadingMyFiles"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="fetchMyProtectedFiles"
                >
                  Refresh
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-alert v-if="myFilesError" class="mb-3" type="error">
                  {{ myFilesError }}
                </v-alert>

                <div v-if="isLoadingMyFiles" class="d-flex justify-center my-4">
                  <v-progress-circular indeterminate />
                </div>

                <v-alert v-else-if="myProtectedFiles.length === 0" type="info">
                  You don't have any password protected files.
                </v-alert>

                <template v-else>
                  <v-table>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Uploaded</th>
                        <th>Expires</th>
                        <th>Downloads</th>
                        <th>Size</th>
                        <th>Shared With</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="file in myProtectedFiles" :key="file.id">
                        <td>
                          <v-tooltip location="top">
                            <template #activator="{ props }">
                              <div class="text-truncate max-w-200" v-bind="props">
                                {{ file.originalFileName }}
                              </div>
                            </template>
                            <span>{{ file.originalFileName }}</span>
                          </v-tooltip>
                        </td>
                        <td>{{ formatDate(file.uploadTime) }}</td>
                        <td>{{ formatDate(file.expiryTime) }}</td>
                        <td>{{ file.downloadCount }}/{{ file.maxDownloads }}</td>
                        <td>{{ formatFileSize(file.fileSize) }}</td>
                        <td>{{ file.sharedWith || 'Not shared' }}</td>
                        <td>
                          <div class="d-flex">
                            <v-btn
                              class="mr-2"
                              color="primary"
                              size="small"
                              @click="handleDownload(file)"
                            >
                              <v-icon start>mdi-download</v-icon>
                              Download
                            </v-btn>
                            <v-btn
                              class="mr-2"
                              color="warning"
                              size="small"
                              @click="handleUpdatePassword(file)"
                            >
                              <v-icon>mdi-key-change</v-icon>
                              <v-tooltip activator="parent" location="top">Change Password</v-tooltip>
                            </v-btn>
                            <v-btn
                              color="info"
                              size="small"
                              @click="togglePasswordVisibility(file)"
                            >
                              <v-icon>mdi-key</v-icon>
                              <v-tooltip activator="parent" location="top">Show Password</v-tooltip>
                            </v-btn>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <!-- Pagination -->
                  <div class="d-flex justify-center mt-4">
                    <v-pagination
                      v-if="myFilesTotalPages > 0"
                      v-model="myFilesPage"
                      :length="myFilesTotalPages"
                      @update:model-value="handleMyFilesPageChange"
                    />
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Files Shared With Me Tab -->
          <v-window-item value="sharedWithMe">
            <v-card>
              <v-card-title class="d-flex align-center">
                Protected Files Shared With Me
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="isLoadingSharedFiles"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="fetchSharedProtectedFiles"
                >
                  Refresh
                </v-btn>
              </v-card-title>

              <v-card-text>
                <v-alert v-if="sharedFilesError" class="mb-3" type="error">
                  {{ sharedFilesError }}
                </v-alert>

                <div v-if="isLoadingSharedFiles" class="d-flex justify-center my-4">
                  <v-progress-circular indeterminate />
                </div>

                <v-alert v-else-if="sharedProtectedFiles.length === 0" type="info">
                  No password protected files have been shared with you.
                </v-alert>

                <template v-else>
                  <v-table>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Shared By</th>
                        <th>Uploaded</th>
                        <th>Expires</th>
                        <th>Downloads</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="file in sharedProtectedFiles" :key="file.id">
                        <td>
                          <v-tooltip location="top">
                            <template #activator="{ props }">
                              <div class="text-truncate max-w-200" v-bind="props">
                                {{ file.originalFileName }}
                              </div>
                            </template>
                            <span>{{ file.originalFileName }}</span>
                          </v-tooltip>
                        </td>
                        <td>{{ file.sharedBy }}</td>
                        <td>{{ formatDate(file.uploadTime) }}</td>
                        <td>{{ formatDate(file.expiryTime) }}</td>
                        <td>{{ file.downloadCount }}/{{ file.maxDownloads }}</td>
                        <td>{{ formatFileSize(file.fileSize) }}</td>
                        <td>
                          <v-btn
                            color="primary"
                            size="small"
                            @click="handleDownload(file)"
                          >
                            <v-icon start>mdi-download</v-icon>
                            Download
                          </v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <!-- Pagination -->
                  <div class="d-flex justify-center mt-4">
                    <v-pagination
                      v-if="sharedFilesTotalPages > 0"
                      v-model="sharedFilesPage"
                      :length="sharedFilesTotalPages"
                      @update:model-value="handleSharedFilesPageChange"
                    />
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <!-- Password Dialog -->
    <v-dialog v-model="passwordDialog" max-width="500px">
      <v-card>
        <v-card-title>Enter Password</v-card-title>
        <v-card-text>
          <p class="mb-4">Enter the password for: <strong>{{ selectedFile?.originalFileName }}</strong></p>

          <v-form @submit.prevent="verifyPassword">
            <v-text-field
              v-model="enteredPassword"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              autofocus
              label="Password"
              required
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showPassword = !showPassword"
            />
          </v-form>

          <v-alert
            v-if="passwordVerificationMessage"
            class="mt-3"
            :type="passwordVerificationSuccess ? 'success' : 'error'"
          >
            {{ passwordVerificationMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            @click="passwordDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!enteredPassword"
            :loading="isVerifying"
            @click="verifyPassword"
          >
            Verify & Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Password Visibility Dialog -->
    <v-dialog v-model="showPasswordDialog" max-width="500px">
      <v-card>
        <v-card-title>File Password</v-card-title>
        <v-card-text>
          <p class="mb-2">File: <strong>{{ selectedFile?.originalFileName }}</strong></p>
          <p class="mb-4">You set the following password for this file:</p>

          <v-text-field
            v-model="filePassword"
            :append-inner-icon="showFilePassword ? 'mdi-eye-off' : 'mdi-eye'"
            readonly
            :type="showFilePassword ? 'text' : 'password'"
            variant="outlined"
            @click:append-inner="showFilePassword = !showFilePassword"
          />

          <div class="d-flex justify-center mb-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-content-copy"
              @click="copyToClipboard"
            >
              Copy to Clipboard
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            @click="showPasswordDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Update Password Dialog -->
    <v-dialog v-model="updatePasswordDialog" max-width="500px">
      <v-card>
        <v-card-title>Update Password</v-card-title>
        <v-card-text>
          <p class="mb-4">Update the password for: <strong>{{ selectedFile?.originalFileName }}</strong></p>

          <v-form @submit.prevent="submitNewPassword">
            <v-text-field
              v-model="newPassword"
              :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              autofocus
              label="New Password"
              required
              :type="showNewPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showNewPassword = !showNewPassword"
            />

            <v-text-field
              v-model="confirmPassword"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              label="Confirm Password"
              required
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            />
          </v-form>

          <v-alert
            v-if="passwordUpdateMessage"
            class="mt-3"
            :type="passwordUpdateSuccess ? 'success' : 'error'"
          >
            {{ passwordUpdateMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            @click="updatePasswordDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!newPassword || !confirmPassword"
            :loading="isUpdatingPassword"
            @click="submitNewPassword"
          >
            Update Password
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
  import { onMounted, ref, watch } from 'vue'
  import fileService from '@/services/fileService' // We'll use the existing file service for downloads
  import { useAuthStore } from '@/stores/authStore'

  // Auth store
  const authStore = useAuthStore()

  // Tab control
  const activeTab = ref('myUploads')

  // My Protected Files state
  const myProtectedFiles = ref<any[]>([])
  const isLoadingMyFiles = ref(false)
  const myFilesError = ref('')
  const myFilesPage = ref(1)
  const myFilesPageSize = ref(10)
  const myFilesTotalPages = ref(0)

  // Shared Protected Files state
  const sharedProtectedFiles = ref<any[]>([])
  const isLoadingSharedFiles = ref(false)
  const sharedFilesError = ref('')
  const sharedFilesPage = ref(1)
  const sharedFilesPageSize = ref(10)
  const sharedFilesTotalPages = ref(0)

  // Password verification state
  const passwordDialog = ref(false)
  const showPassword = ref(false)
  const enteredPassword = ref('')
  const selectedFile = ref<any>(null)
  const isVerifying = ref(false)
  const passwordVerificationMessage = ref('')
  const passwordVerificationSuccess = ref(false)

  // Password visibility dialog (for files you own)
  const showPasswordDialog = ref(false)
  const showFilePassword = ref(false)
  const filePassword = ref('')

  // Update password dialog
  const updatePasswordDialog = ref(false)
  const newPassword = ref('')
  const confirmPassword = ref('')
  const isUpdatingPassword = ref(false)
  const passwordUpdateMessage = ref('')
  const passwordUpdateSuccess = ref(false)

  // Snackbar state
  const showSnackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('success')

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Format file size
  const formatFileSize = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = Math.max(decimals, 0)
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Show message function
  const showMessage = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
    snackbarMessage.value = message
    snackbarColor.value = color
    showSnackbar.value = true
  }

  // Fetch my protected files
  const fetchMyProtectedFiles = async () => {
    isLoadingMyFiles.value = true
    myFilesError.value = ''

    try {
      const response = await axios.get('/api/protected-files/my-uploads', {
        params: {
          page: myFilesPage.value - 1, // API uses zero-based indexing
          size: myFilesPageSize.value,
        },
        headers: { Authorization: `Bearer ${authStore.token}` },
      })

      myProtectedFiles.value = response.data.content
      myFilesTotalPages.value = response.data.totalPages
    } catch (error: any) {
      console.error('Failed to fetch protected files:', error)
      myFilesError.value = error.response?.data?.message || 'Failed to load your protected files'
    } finally {
      isLoadingMyFiles.value = false
    }
  }

  // Fetch shared protected files
  const fetchSharedProtectedFiles = async () => {
    isLoadingSharedFiles.value = true
    sharedFilesError.value = ''

    try {
      const response = await axios.get('/api/protected-files/shared-with-me', {
        params: {
          page: sharedFilesPage.value - 1, // API uses zero-based indexing
          size: sharedFilesPageSize.value,
        },
        headers: { Authorization: `Bearer ${authStore.token}` },
      })

      sharedProtectedFiles.value = response.data.content
      sharedFilesTotalPages.value = response.data.totalPages
    } catch (error: any) {
      console.error('Failed to fetch shared protected files:', error)
      sharedFilesError.value = error.response?.data?.message || 'Failed to load protected files shared with you'
    } finally {
      isLoadingSharedFiles.value = false
    }
  }

  // Handle pagination
  const handleMyFilesPageChange = () => {
    fetchMyProtectedFiles()
  }

  const handleSharedFilesPageChange = () => {
    fetchSharedProtectedFiles()
  }

  // Handle download
  const handleDownload = (file: any) => {
    selectedFile.value = file
    enteredPassword.value = ''
    passwordVerificationMessage.value = ''
    passwordDialog.value = true
  }

  // Verify password and download
  const verifyPassword = async () => {
    if (!selectedFile.value || !enteredPassword.value) return

    isVerifying.value = true
    passwordVerificationMessage.value = ''

    try {
      const response = await axios.post(
        `/api/protected-files/${selectedFile.value.id}/verify-password`,
        { password: enteredPassword.value },
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      if (response.data.success) {
        passwordVerificationSuccess.value = true
        passwordVerificationMessage.value = response.data.message

        // Wait a moment to show success message then download
        setTimeout(async () => {
          try {
            // Use existing fileService to download with password
            const blob = await fileService.downloadFileById(selectedFile.value.id, enteredPassword.value)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = selectedFile.value.originalFileName
            document.body.append(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)

            passwordDialog.value = false

            // Refresh the file lists to update download counts
            if (activeTab.value === 'myUploads') {
              fetchMyProtectedFiles()
            } else {
              fetchSharedProtectedFiles()
            }
          } catch (downloadError: any) {
            showMessage('Error downloading file: ' + (downloadError.message || 'Unknown error'), 'error')
          }
        }, 1500)
      } else {
        passwordVerificationSuccess.value = false
        passwordVerificationMessage.value = response.data.message || 'Invalid password'
      }
    } catch (error: any) {
      console.error('Password verification failed:', error)
      passwordVerificationSuccess.value = false
      passwordVerificationMessage.value = error.response?.data?.message || 'Password verification failed'
    } finally {
      isVerifying.value = false
    }
  }

  // Toggle password visibility for your own files
  const togglePasswordVisibility = (file: any) => {
    selectedFile.value = file

    // In a real application, you'd need to fetch the password from your backend
    // For demonstration, we'll use a placeholder password
    filePassword.value = '********' // This would come from an API call
    showFilePassword.value = false
    showPasswordDialog.value = true
  }

  // Copy password to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(filePassword.value)
      .then(() => {
        showMessage('Password copied to clipboard', 'success')
      })
      .catch(() => {
        showMessage('Failed to copy password', 'error')
      })
  }

  // Handle update password
  const handleUpdatePassword = (file: any) => {
    selectedFile.value = file
    newPassword.value = ''
    confirmPassword.value = ''
    passwordUpdateMessage.value = ''
    updatePasswordDialog.value = true
  }

  // Submit new password
  const submitNewPassword = async () => {
    if (!selectedFile.value || !newPassword.value || !confirmPassword.value) return

    if (newPassword.value !== confirmPassword.value) {
      showMessage('Passwords do not match', 'error')
      return
    }

    isUpdatingPassword.value = true
    passwordUpdateMessage.value = ''

    try {
      const response = await axios.post(
        `/api/protected-files/${selectedFile.value.id}/update-password`,
        { password: newPassword.value },
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      passwordUpdateSuccess.value = response.data.success
      passwordUpdateMessage.value = response.data.message

      if (response.data.success) {
        // Optionally, you can refresh the file list or take other actions
        fetchMyProtectedFiles()
      }
    } catch (error: any) {
      console.error('Failed to update password:', error)
      passwordUpdateSuccess.value = false
      passwordUpdateMessage.value = error.response?.data?.message || 'Failed to update password'
    } finally {
      isUpdatingPassword.value = false
    }
  }

  // Load data on component mount
  onMounted(() => {
    if (authStore.isAuthenticated) {
      fetchMyProtectedFiles()
      fetchSharedProtectedFiles()
    }
  })

  // Watch for tab changes
  watch(activeTab, () => {
    if (activeTab.value === 'myUploads' && myProtectedFiles.value.length === 0) {
      fetchMyProtectedFiles()
    } else if (activeTab.value === 'sharedWithMe' && sharedProtectedFiles.value.length === 0) {
      fetchSharedProtectedFiles()
    }
  })

  // Watch for auth changes
  authStore.$subscribe(() => {
    if (authStore.isAuthenticated) {
      fetchMyProtectedFiles()
      fetchSharedProtectedFiles()
    }
  })
</script>

<style scoped>
.max-w-200 {
  max-width: 200px;
}
</style>
