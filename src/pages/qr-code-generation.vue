<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 my-4">QR Code Generation for Download Links</h1>
        <p class="text-body-1 mb-4">
          Easily share download links by generating QR codes for quick and convenient access on mobile devices.
        </p>

        <v-alert
          v-if="error"
          class="mb-4"
          closable
          type="error"
        >
          {{ error }}
        </v-alert>

        <!-- Token Download Section -->
        <v-card class="mb-6">
          <v-card-title class="text-h6">Download File with Token</v-card-title>
          <v-card-text>
            <p class="mb-3">Enter a secure download token to retrieve a file:</p>
            <v-form @submit.prevent="downloadWithToken">
              <v-row>
                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="inputToken"
                    :disabled="downloadingWithToken"
                    label="Secure Download Token"
                    placeholder="Paste your download token here"
                    variant="outlined"
                  />
                </v-col>
                <v-col class="d-flex align-center" cols="12" sm="4">
                  <v-btn
                    block
                    color="primary"
                    :disabled="!inputToken"
                    :loading="downloadingWithToken"
                    type="submit"
                  >
                    <v-icon start>mdi-download</v-icon>
                    Download File
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Files List Section -->
        <v-card class="mb-6">
          <v-card-title class="text-h6">Your Files</v-card-title>
          <v-card-text>
            <v-data-table
              v-if="files.length > 0"
              class="elevation-1"
              :headers="headers"
              :items="files"
              :items-per-page="10"
              :loading="loadingFiles"
            >
              <template #item.originalFileName="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">mdi-file-document-outline</v-icon>
                  {{ item.originalFileName }}
                </div>
              </template>

              <template #item.fileSize="{ item }">
                {{ formatFileSize(item.fileSize) }}
              </template>

              <template #item.uploadTime="{ item }">
                {{ formatDate(item.uploadTime) }}
              </template>

              <template #item.expiryTime="{ item }">
                {{ formatDate(item.expiryTime) }}
              </template>

              <template #item.actions="{ item }">
                <v-tooltip bottom>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      density="comfortable"
                      icon
                      variant="text"
                      @click="viewQrCode(item)"
                    >
                      <v-icon>mdi-qrcode</v-icon>
                    </v-btn>
                  </template>
                  <span>Generate QR code</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      density="comfortable"
                      icon
                      variant="text"
                      @click="generateAndDownloadQR(item.id)"
                    >
                      <v-icon>mdi-download</v-icon>
                    </v-btn>
                  </template>
                  <span>Download QR code</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      density="comfortable"
                      icon
                      variant="text"
                      @click="generateDownloadToken(item.id)"
                    >
                      <v-icon>mdi-link-variant</v-icon>
                    </v-btn>
                  </template>
                  <span>Generate secure download link</span>
                </v-tooltip>
              </template>
            </v-data-table>

            <div v-else-if="!loadingFiles" class="text-center py-4">
              <v-icon class="mb-3" size="large">mdi-file-outline</v-icon>
              <p>No files found. Upload some files to generate QR codes.</p>
            </div>

            <v-progress-circular v-if="loadingFiles" class="mx-auto d-block my-4" indeterminate size="32" />
          </v-card-text>
        </v-card>

        <!-- QR Code Dialog -->
        <v-dialog v-model="qrDialog" max-width="500">
          <v-card>
            <v-card-title>
              <span class="text-h6">QR Code for {{ selectedFile?.originalFileName || 'File' }}</span>
              <v-spacer />
              <v-btn icon @click="qrDialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text class="text-center">
              <!-- Removed tabs as we no longer need embed code tab -->
              <div v-if="qrCodeLoading" class="my-6">
                <v-progress-circular color="primary" indeterminate />
                <div class="mt-3">Generating QR code...</div>
              </div>

              <div v-else-if="qrCodeBase64" class="my-6">
                <img
                  alt="QR Code"
                  class="elevation-2"
                  :src="`data:image/png;base64,${qrCodeBase64}`"
                  style="max-width: 250px; margin: auto;"
                >

                <div class="mt-4">
                  <v-btn color="primary" prepend-icon="mdi-download" @click="generateAndDownloadQR(selectedFile?.id)">
                    Download QR Code
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Download Token Dialog -->
        <v-dialog v-model="tokenDialog" max-width="600">
          <v-card>
            <v-card-title>
              <span class="text-h6">Secure Download Link</span>
              <v-spacer />
              <v-btn icon @click="tokenDialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text>
              <div v-if="tokenDialogState === 'selectExpiry'" class="my-4">
                <p class="mb-4">Select how long the download link should remain valid:</p>

                <v-radio-group v-model="selectedExpiryMinutes" class="mb-5">
                  <v-radio label="5 minutes (default)" value="5" />
                  <v-radio label="30 minutes" value="30" />
                  <v-radio label="1 hour" value="60" />
                  <v-radio label="24 hours" value="1440" />
                  <v-radio label="Custom" value="custom" />
                </v-radio-group>

                <v-text-field
                  v-if="selectedExpiryMinutes === 'custom'"
                  v-model="customExpiryMinutes"
                  class="mb-4"
                  hint="Between 1 minute and 7 days (10080 minutes)"
                  label="Custom expiry time (minutes)"
                  max="10080"
                  min="1"
                  type="number"
                />

                <div class="d-flex justify-end gap-2">
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    @click="tokenDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    :disabled="selectedExpiryMinutes === 'custom' && (!customExpiryMinutes || customExpiryMinutes < 1)"
                    @click="generateDownloadTokenWithExpiry()"
                  >
                    Generate Link
                  </v-btn>
                </div>
              </div>

              <div v-else-if="loadingToken" class="text-center my-4">
                <v-progress-circular color="primary" indeterminate />
                <p class="mt-2">Generating secure download link...</p>
              </div>

              <div v-else-if="downloadToken" class="mb-3">
                <p class="mb-4">
                  Share this secure download link. It will expire in
                  <span class="font-weight-bold">{{ formatExpiryTime() }}</span>:
                </p>

                <v-alert class="mb-4" color="info" variant="tonal">
                  <p class="mb-2"><strong>Download Token:</strong></p>
                  <v-text-field
                    append-inner-icon="mdi-content-copy"
                    bg-color="grey-lighten-4"
                    class="mb-3"
                    :model-value="downloadToken"
                    readonly
                    @click:append-inner="copyDownloadToken"
                  />
                </v-alert>

                <v-alert class="mb-4" color="success" variant="tonal">
                  <p class="mb-2"><strong>Frontend App URL (Recommended):</strong></p>
                  <p class="mb-2">Share this URL for users to download the file through the application:</p>
                  <v-text-field
                    append-inner-icon="mdi-content-copy"
                    bg-color="grey-lighten-4"
                    class="mb-3"
                    :model-value="frontendAppUrl"
                    readonly
                    @click:append-inner="copyFrontendUrl"
                  />
                </v-alert>

                <v-alert color="warning" variant="tonal">
                  <p class="mb-2"><strong>Public Direct Download URL:</strong></p>
                  <p class="mb-2">Share this URL for users without an account to download directly:</p>
                  <v-text-field
                    append-inner-icon="mdi-content-copy"
                    bg-color="grey-lighten-4"
                    class="mb-3"
                    :model-value="directDownloadUrl"
                    readonly
                    @click:append-inner="copyDirectUrl"
                  />
                </v-alert>

                <div class="d-flex flex-wrap gap-2 justify-center mt-4">
                  <v-btn color="info" prepend-icon="mdi-content-copy" @click="copyDownloadToken">
                    Copy Token
                  </v-btn>
                  <v-btn color="success" prepend-icon="mdi-content-copy" @click="copyFrontendUrl">
                    Copy Frontend URL
                  </v-btn>
                  <v-btn color="warning" prepend-icon="mdi-content-copy" @click="copyDirectUrl">
                    Copy Public URL
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Snackbar for Notifications -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color">
          {{ snackbar.text }}
          <template #actions>
            <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
          </template>
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import type { FileMetaResponseDto } from '@/services/fileService'
  import { computed, onMounted, ref } from 'vue'
  import fileService from '@/services/fileService'

  // Data
  const files = ref<FileMetaResponseDto[]>([])
  const loadingFiles = ref(true)
  const error = ref<string | null>(null)
  const qrDialog = ref(false)
  const tokenDialog = ref(false)
  const selectedFile = ref<FileMetaResponseDto | null>(null)
  const qrCodeBase64 = ref<string | null>(null)
  const qrCodeLoading = ref(false)
  const downloadingWithToken = ref(false)
  const inputToken = ref('')
  const loadingToken = ref(false)
  const downloadToken = ref<string | null>(null)
  const tokenDialogState = ref<'selectExpiry' | 'loading' | 'generated'>('selectExpiry')
  const selectedExpiryMinutes = ref<number | 'custom'>(5)
  const customExpiryMinutes = ref<number | null>(null)

  // Snackbar
  const snackbar = ref({
    show: false,
    text: '',
    color: 'success',
  })

  // Table headers
  const headers = [
    { title: 'File Name', key: 'originalFileName', sortable: true },
    { title: 'Size', key: 'fileSize', sortable: true },
    { title: 'Uploaded Date', key: 'uploadTime', sortable: true },
    { title: 'Expiry Date', key: 'expiryTime', sortable: true },
    { title: 'Downloads', key: 'downloadCount', sortable: true, align: 'center' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
  ]

  // Computed properties
  // Embed code computed property (commented out as it's not needed anymore)
  // const embedCode = computed(() => {
  //   if (!qrCodeBase64.value) return ''
  //   return `<img src="data:image/png;base64,${qrCodeBase64.value}" alt="QR Code" style="width:250px;height:250px;" />`
  // })

  const directDownloadUrl = computed(() => {
    if (!downloadToken.value) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/api/files/secure-download?token=${downloadToken.value}`
  })

  const frontendAppUrl = computed(() => {
    if (!downloadToken.value) return ''
    const baseUrl = window.location.origin
    // Create a URL that points to this page with the token as a query parameter
    return `${baseUrl}/qr-code-generation?token=${downloadToken.value}`
  })

  // Methods
  const loadFiles = async () => {
    loadingFiles.value = true
    error.value = null

    try {
      files.value = await fileService.getMyUploads()
    } catch (error_) {
      console.error('Error loading files:', error_)
      error.value = 'Failed to load files. Please try again later.'
    } finally {
      loadingFiles.value = false
    }
  }

  const viewQrCode = async (file: FileMetaResponseDto) => {
    selectedFile.value = file
    qrDialog.value = true
    qrCodeBase64.value = null
    qrCodeLoading.value = true

    try {
      const response = await fileService.getBase64QrCode(file.id)
      qrCodeBase64.value = response.qrCodeBase64
    } catch (error_) {
      console.error('Error generating QR code:', error_)
      showSnackbar('Failed to generate QR code', 'error')
    } finally {
      qrCodeLoading.value = false
    }
  }

  const generateAndDownloadQR = async (fileId?: string) => {
    if (!fileId && selectedFile.value) fileId = selectedFile.value.id
    if (!fileId) return

    try {
      const blob = await fileService.downloadQrCode(fileId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-${fileId}.png`
      document.body.append(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      showSnackbar('QR code downloaded successfully')
    } catch (error_) {
      console.error('Error downloading QR code:', error_)
      showSnackbar('Failed to download QR code', 'error')
    }
  }

  const generateDownloadToken = async (fileId: string) => {
    // Set the selected file to use later in token generation
    for (const file of files.value) {
      if (file.id === fileId) {
        selectedFile.value = file
        break
      }
    }

    // Reset states
    downloadToken.value = null
    tokenDialogState.value = 'selectExpiry'

    // Show the dialog to let user select expiry time
    tokenDialog.value = true
  }

  const downloadWithToken = async () => {
    if (!inputToken.value) return

    downloadingWithToken.value = true

    try {
      const blob = await fileService.secureDownload(inputToken.value)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'downloaded-file' // The file will have proper name based on Content-Disposition header
      document.body.append(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      showSnackbar('File downloaded successfully')
      inputToken.value = '' // Clear the input token after successful download
    } catch (error_) {
      console.error('Error downloading file with token:', error_)
      showSnackbar('Failed to download file. The token may be invalid or expired.', 'error')
    } finally {
      downloadingWithToken.value = false
    }
  }

  const generateDownloadTokenWithExpiry = async () => {
    if (!selectedFile.value) return

    tokenDialogState.value = 'loading'
    loadingToken.value = true

    try {
      // Determine the expiry minutes value based on selection
      let expiryMinutes: number
      expiryMinutes = selectedExpiryMinutes.value === 'custom' ? Number(customExpiryMinutes.value) || 5 : Number(selectedExpiryMinutes.value);

      // Make sure we have a valid number
      if (Number.isNaN(expiryMinutes) || expiryMinutes <= 0) {
        expiryMinutes = 5 // Default to 5 minutes if invalid
      }

      // Generate the download token with proper numeric expiry minutes
      downloadToken.value = await fileService.generateDownloadToken(selectedFile.value.id, expiryMinutes)
      tokenDialogState.value = 'generated'
    } catch (error_) {
      console.error('Error generating download token with expiry:', error_)
      showSnackbar('Failed to generate download token', 'error')
      tokenDialogState.value = 'selectExpiry'
    } finally {
      loadingToken.value = false
    }
  }

  // Copy functions
  const copyDownloadToken = () => {
    if (!downloadToken.value) return
    navigator.clipboard.writeText(downloadToken.value)
      .then(() => showSnackbar('Download token copied to clipboard'))
      .catch(() => showSnackbar('Failed to copy token', 'error'))
  }

  const copyDirectUrl = () => {
    navigator.clipboard.writeText(directDownloadUrl.value)
      .then(() => showSnackbar('Direct download URL copied to clipboard'))
      .catch(() => showSnackbar('Failed to copy URL', 'error'))
  }

  const copyFrontendUrl = () => {
    navigator.clipboard.writeText(frontendAppUrl.value)
      .then(() => showSnackbar('Frontend URL copied to clipboard'))
      .catch(() => showSnackbar('Failed to copy URL', 'error'))
  }

  // Embed code copy function (commented out as it's not needed anymore)
  // const copyEmbedCode = () => {
  //   navigator.clipboard.writeText(embedCode.value)
  //     .then(() => showSnackbar('Embed code copied to clipboard'))
  //     .catch(() => showSnackbar('Failed to copy embed code', 'error'))
  // }

  const showSnackbar = (text: string, color = 'success') => {
    snackbar.value = {
      show: true,
      text,
      color,
    }
  }

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatExpiryTime = () => {
    if (!downloadToken.value) return ''
    const expiryDate = new Date(Date.now() + (selectedExpiryMinutes.value === 'custom' ? (customExpiryMinutes.value! * 60_000) : (selectedExpiryMinutes.value! * 60_000)))
    return expiryDate.toLocaleString()
  }

  // Check for token in URL when page loads
  onMounted(() => {
    loadFiles()

    // Check if a token was provided in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    if (token) {
      inputToken.value = token
      // Automatically download if token is present
      downloadWithToken()
    }
  })
</script>

<style scoped>
.code-textarea {
  font-family: monospace;
}

.gap-2 {
  gap: 8px;
}
</style>
