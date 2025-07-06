<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 my-4">Access Logs</h1>
        <p class="text-body-1 mb-4">
          Track who has accessed your uploaded files, including IP addresses, timestamps, and user information.
        </p>

        <!-- Main Control Panel -->
        <v-card class="mb-6">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4" sm="6">
                <v-text-field
                  v-model="filenameFilter"
                  clearable
                  label="Filter by Filename"
                  placeholder="Enter file name to search"
                  prepend-inner-icon="mdi-magnify"
                  @update:model-value="debouncedSearch"
                />
              </v-col>
              <v-col cols="12" md="4" sm="6">
                <v-select
                  v-model="dateRange"
                  item-title="text"
                  item-value="value"
                  :items="dateRangeOptions"
                  label="Time Range"
                />
              </v-col>
              <v-spacer />
              <v-col class="d-flex align-center justify-end" cols="12" md="4" sm="6">
                <v-select
                  v-model="viewMode"
                  class="view-mode-select mr-2"
                  density="compact"
                  hide-details
                  :items="viewModeOptions"
                />
                <v-btn
                  class="mr-2"
                  color="primary"
                  :loading="isLoading"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="fetchDownloadLogs"
                >
                  Refresh
                </v-btn>
                <v-btn
                  color="success"
                  :loading="isExporting"
                  prepend-icon="mdi-file-export"
                  @click="exportLogs"
                >
                  Export CSV
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Files View (Grouped by File) -->
        <v-card v-if="viewMode === 'files'" class="mb-6">
          <v-card-title class="d-flex align-center">
            Files Overview
            <v-chip class="ml-2" color="primary" size="small">{{ groupedFiles.length }} files</v-chip>
            <v-spacer />
          </v-card-title>

          <v-card-text>
            <div v-if="isLoading" class="d-flex justify-center my-4">
              <v-progress-circular indeterminate />
            </div>

            <v-alert v-else-if="errorMessage" class="mb-3" type="error">
              {{ errorMessage }}
            </v-alert>

            <v-alert v-else-if="groupedFiles.length === 0" type="info">
              No download logs found for the selected filters.
            </v-alert>

            <v-table v-else>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Downloads</th>
                  <th>Latest Download</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in groupedFiles" :key="file.fileId">
                  <td>
                    <v-tooltip location="top">
                      <template #activator="{ props }">
                        <div class="text-truncate max-w-200" v-bind="props">
                          {{ file.fileName }}
                        </div>
                      </template>
                      <span>{{ file.fileName }}</span>
                    </v-tooltip>
                  </td>
                  <td>{{ file.downloadCount }}</td>
                  <td>{{ formatDate(file.lastDownloadTime) }}</td>
                  <td>
                    <div class="d-flex">
                      <v-btn
                        class="mr-2"
                        color="info"
                        density="compact"
                        icon
                        size="small"
                        @click="viewFileDetails(file.fileId, file.fileName)"
                      >
                        <v-icon>mdi-eye</v-icon>
                        <v-tooltip activator="parent" location="top">View download details</v-tooltip>
                      </v-btn>
                      <v-btn
                        color="primary"
                        density="compact"
                        icon
                        :loading="exportingFileId === file.fileId"
                        size="small"
                        @click="exportFileSpecificLogs(file.fileId)"
                      >
                        <v-icon>mdi-file-export</v-icon>
                        <v-tooltip activator="parent" location="top">Export logs for this file</v-tooltip>
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <!-- Pagination for Files View -->
            <div class="d-flex justify-center mt-4">
              <v-pagination
                v-if="totalPages > 0"
                v-model="page"
                :length="totalPages"
                @update:model-value="handlePageChange"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Logs View (All Downloads) -->
        <v-card v-if="viewMode === 'logs'">
          <v-card-title class="d-flex align-center">
            Download Activity
            <v-chip class="ml-2" color="primary" size="small">{{ totalLogs }} logs</v-chip>
            <v-spacer />
          </v-card-title>

          <v-card-text>
            <div v-if="isLoading" class="d-flex justify-center my-4">
              <v-progress-circular indeterminate />
            </div>

            <v-alert v-else-if="errorMessage" class="mb-3" type="error">
              {{ errorMessage }}
            </v-alert>

            <v-alert v-else-if="downloadLogs.length === 0" type="info">
              No download logs found for the selected filters.
            </v-alert>

            <v-table v-else density="compact">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Downloaded By</th>
                  <th>IP Address</th>
                  <th>Download Time</th>
                  <th>User Agent</th>
                  <th>Version</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in downloadLogs" :key="log.id">
                  <td>
                    <v-tooltip location="top">
                      <template #activator="{ props }">
                        <div class="text-truncate max-w-200" v-bind="props">
                          {{ log.fileName }}
                        </div>
                      </template>
                      <span>{{ log.fileName }}</span>
                    </v-tooltip>
                  </td>
                  <td>
                    {{ log.downloaderUsername ? `Username: ${log.downloaderUsername}` : 'Anonymous' }}
                  </td>
                  <td>{{ log.downloaderIp }}</td>
                  <td>{{ formatDate(log.downloadTime) }}</td>
                  <td>
                    <v-tooltip location="top">
                      <template #activator="{ props }">
                        <div class="text-truncate max-w-200" v-bind="props">
                          {{ log.userAgent }}
                        </div>
                      </template>
                      <span>{{ log.userAgent }}</span>
                    </v-tooltip>
                  </td>
                  <td>{{ log.fileVersion || 'N/A' }}</td>
                  <td>
                    <v-btn
                      color="primary"
                      density="compact"
                      icon
                      :loading="exportingFileId === log.fileId"
                      size="small"
                      @click="exportFileSpecificLogs(log.fileId)"
                    >
                      <v-icon>mdi-file-export</v-icon>
                      <v-tooltip activator="parent" location="top">Export logs for this file</v-tooltip>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <!-- Pagination -->
            <div class="d-flex justify-center mt-4">
              <v-pagination
                v-if="totalPages > 0"
                v-model="page"
                :length="totalPages"
                @update:model-value="handlePageChange"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- File Details Dialog -->
    <v-dialog v-model="fileDetailsDialog" max-width="900px">
      <v-card>
        <v-card-title class="d-flex align-center">
          Download Details
          <v-spacer />
          <v-btn icon @click="fileDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-subtitle>
          {{ selectedFileName }}
        </v-card-subtitle>
        <v-card-text>
          <div v-if="isLoadingDetails" class="d-flex justify-center my-4">
            <v-progress-circular indeterminate />
          </div>
          <div v-else>
            <v-expansion-panels>
              <v-expansion-panel
                v-for="log in fileDetails"
                :key="log.id"
                class="mb-2"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="text-subtitle-2">
                      <v-icon
                        class="mr-2"
                        color="primary"
                      >
                        mdi-download
                      </v-icon>
                      {{ formatDate(log.downloadTime) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ log.downloaderUsername ? `Username: ${log.downloaderUsername}` : 'Anonymous' }} •
                      {{ log.downloaderIp }}
                    </div>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-card flat>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <p class="text-subtitle-2 mb-1">Download Information</p>
                          <v-list class="bg-surface-variant rounded" density="compact">
                            <v-list-item>
                              <template #prepend>
                                <v-icon>mdi-calendar-clock</v-icon>
                              </template>
                              <v-list-item-title>Download Time</v-list-item-title>
                              <v-list-item-subtitle>{{ formatDate(log.downloadTime) }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <template #prepend>
                                <v-icon>mdi-file-document</v-icon>
                              </template>
                              <v-list-item-title>File Name</v-list-item-title>
                              <v-list-item-subtitle>{{ log.fileName }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <template #prepend>
                                <v-icon>mdi-numeric</v-icon>
                              </template>
                              <v-list-item-title>File Version</v-list-item-title>
                              <v-list-item-subtitle>{{ log.fileVersion || 'N/A' }}</v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-col>
                        <v-col cols="12" md="6">
                          <p class="text-subtitle-2 mb-1">Device Information</p>
                          <v-list class="bg-surface-variant rounded" density="compact">
                            <v-list-item>
                              <template #prepend>
                                <v-icon>mdi-account</v-icon>
                              </template>
                              <v-list-item-title>Downloaded By</v-list-item-title>
                              <v-list-item-subtitle>{{ log.downloaderUsername ? `Username: ${log.downloaderUsername}` : 'Anonymous User' }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <template #prepend>
                                <v-icon>mdi-ip-network</v-icon>
                              </template>
                              <v-list-item-title>IP Address</v-list-item-title>
                              <v-list-item-subtitle>{{ log.downloaderIp }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                              <template #prepend>
                                <v-icon>mdi-laptop</v-icon>
                              </template>
                              <v-list-item-title>User Agent</v-list-item-title>
                              <v-list-item-subtitle class="user-agent-text">{{ log.userAgent }}</v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-col>
                      </v-row>

                      <v-divider class="my-4" />

                      <!-- Additional information if available -->
                      <div v-if="log.additionalInfo">
                        <p class="text-subtitle-2 mb-1">Additional Information</p>
                        <pre class="log-details-pre pa-3 bg-surface-variant rounded">{{ JSON.stringify(log.additionalInfo, null, 2) }}</pre>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="isExporting"
            @click="exportFileSpecificLogs(selectedFileId)"
          >
            Export as CSV
          </v-btn>
          <v-btn
            color="secondary"
            @click="fileDetailsDialog = false"
          >
            Close
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
  import { computed, onMounted, ref, watch } from 'vue'
  import { useAuthStore } from '@/stores/authStore'

  // Auth store
  const authStore = useAuthStore()

  // View mode
  const viewMode = ref('files') // 'files' or 'logs'
  const viewModeOptions = [
    { title: 'Files Overview', value: 'files' },
    { title: 'All Download Logs', value: 'logs' },
  ]

  // Filter state
  const filenameFilter = ref('')
  const dateRange = ref('all')
  const dateRangeOptions = [
    { text: 'All Time', value: 'all' },
    { text: 'Last 24 Hours', value: '24h' },
    { text: 'Last 7 Days', value: '7d' },
    { text: 'Last 30 Days', value: '30d' },
    { text: 'Last 90 Days', value: '90d' },
  ]

  // Pagination state
  const page = ref(1)
  const pageSize = ref(10)
  const totalLogs = ref(0)
  const totalPages = ref(0)

  // Log data
  const downloadLogs = ref<any[]>([])
  const groupedFiles = ref<any[]>([])
  const isLoading = ref(false)
  const isExporting = ref(false)
  const exportingFileId = ref<string | null>(null)
  const errorMessage = ref('')

  // File details dialog
  const fileDetailsDialog = ref(false)
  const selectedFileId = ref('')
  const selectedFileName = ref('')
  const fileDetails = ref<any[]>([])
  const isLoadingDetails = ref(false)

  // Snackbar
  const showSnackbar = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('success')

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Helper function to show message
  const showMessage = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
    snackbarMessage.value = message
    snackbarColor.value = color
    showSnackbar.value = true
  }

  // Calculate date range for filters
  const getDateRangeFilter = () => {
    if (dateRange.value === 'all') return null

    const now = new Date()
    const startDate = new Date()

    switch (dateRange.value) {
      case '24h': {
        startDate.setHours(startDate.getHours() - 24)
        break
      }
      case '7d': {
        startDate.setDate(startDate.getDate() - 7)
        break
      }
      case '30d': {
        startDate.setDate(startDate.getDate() - 30)
        break
      }
      case '90d': {
        startDate.setDate(startDate.getDate() - 90)
        break
      }
    }

    return { start: startDate.toISOString(), end: now.toISOString() }
  }

  // Debounced search for filename filter
  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  const debouncedSearch = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(() => {
      page.value = 1 // Reset to first page on new search
      fetchDownloadLogs()
    }, 300)
  }

  // Group logs by file
  const groupLogsByFile = (logs: any[]) => {
    const groupedMap = new Map()

    for (const log of logs) {
      if (groupedMap.has(log.fileId)) {
        const group = groupedMap.get(log.fileId)
        group.downloadCount++

        // Update last download time if this log is more recent
        const currentLastTime = new Date(group.lastDownloadTime).getTime()
        const newTime = new Date(log.downloadTime).getTime()
        if (newTime > currentLastTime) {
          group.lastDownloadTime = log.downloadTime
        }

        group.logs.push(log)
      } else {
        groupedMap.set(log.fileId, {
          fileId: log.fileId,
          fileName: log.fileName,
          downloadCount: 1,
          lastDownloadTime: log.downloadTime,
          logs: [log],
        })
      }
    }

    return Array.from(groupedMap.values())
  }

  // Fetch download logs with current filters
  const fetchDownloadLogs = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const url = '/api/audit/my-uploads/logs'
      const params: any = {
        page: page.value - 1, // API uses zero-based indexing for pages
        size: pageSize.value,
      }

      // Add filters if available
      if (filenameFilter.value) {
        params.filename = filenameFilter.value
      }

      const dateRangeFilter = getDateRangeFilter()
      if (dateRangeFilter) {
        params.startDate = dateRangeFilter.start
        params.endDate = dateRangeFilter.end
      }

      const response = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${authStore.token}` },
      })

      // Update the data from the response
      downloadLogs.value = response.data.content
      totalLogs.value = response.data.totalElements
      totalPages.value = response.data.totalPages

      // Group logs by file for the files view
      groupedFiles.value = groupLogsByFile(response.data.content)
    } catch (error: any) {
      console.error('Failed to fetch download logs:', error)
      errorMessage.value = error.response?.data?.message || 'Failed to load download logs'
    } finally {
      isLoading.value = false
    }
  }

  // View file details
  const viewFileDetails = async (fileId: string, fileName: string) => {
    selectedFileId.value = fileId
    selectedFileName.value = fileName
    fileDetailsDialog.value = true
    isLoadingDetails.value = true
    fileDetails.value = [] // Reset previous data

    try {
      // Instead of making a separate API call, we'll use the data we already have
      // from the current grouped file that was clicked
      const fileGroup = groupedFiles.value.find(group => group.fileId === fileId)

      if (fileGroup && fileGroup.logs && fileGroup.logs.length > 0) {
        // Use the logs that were already fetched with the file
        fileDetails.value = fileGroup.logs
      } else {
        // If we don't have the logs in the current file group (which might happen if data structure changes),
        // try to filter from all logs we have
        const filteredLogs = downloadLogs.value.filter(log => log.fileId === fileId)

        if (filteredLogs.length > 0) {
          fileDetails.value = filteredLogs
        } else {
          // If we still don't have logs, attempt to fetch them from the server
          const url = `/api/audit/my-uploads/logs`
          const params = {
            // Don't paginate here - we want all logs for this specific file
            fileId: fileId,
          }

          const response = await axios.get(url, {
            params,
            headers: { Authorization: `Bearer ${authStore.token}` },
          })

          // Check if we got valid data back
          if (response.data && response.data.content && Array.isArray(response.data.content)) {
            fileDetails.value = response.data.content.filter(log => log.fileId === fileId)
          }
        }
      }

      // If we still don't have any valid logs, show a message
      if (fileDetails.value.length === 0) {
        showMessage('No download logs found for this file', 'info')
      }
    } catch (error: any) {
      console.error('Failed to fetch file details:', error)
      showMessage(error.response?.data?.message || 'Failed to load file details', 'error')
      fileDetails.value = [] // Ensure empty array rather than undefined
    } finally {
      isLoadingDetails.value = false
    }
  }

  // Handle page change
  const handlePageChange = () => {
    fetchDownloadLogs()
  }

  // Export all logs as CSV
  const exportLogs = async () => {
    isExporting.value = true

    try {
      // According to the API docs, we should use this endpoint:
      const url = '/api/audit/my-uploads/logs/export'

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authStore.token}` },
        responseType: 'blob',
      })

      // Create a download link for the CSV
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url_download = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url_download
      a.download = 'my_upload_logs.csv'

      document.body.append(a)
      a.click()
      window.URL.revokeObjectURL(url_download)
      a.remove()

      showMessage('Logs exported successfully')
    } catch (error: any) {
      console.error('Failed to export logs:', error)
      showMessage(error.response?.data?.message || 'Failed to export logs', 'error')
    } finally {
      isExporting.value = false
    }
  }

  // Export logs for a specific file
  // Note: According to the API docs, only admins can export file-specific logs
  // So this might not work for regular users
  const exportFileSpecificLogs = async (fileId: string) => {
    if (!fileId) return

    exportingFileId.value = fileId
    try {
      // According to the API docs, this endpoint requires admin permissions:
      const url = `/api/audit/export/${fileId}`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authStore.token}` },
        responseType: 'blob',
      })

      // Create a download link for the CSV
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url_download = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url_download
      a.download = `download_logs_${fileId}.csv`

      document.body.append(a)
      a.click()
      window.URL.revokeObjectURL(url_download)
      a.remove()

      showMessage(`Logs for file exported successfully`)
    } catch (error: any) {
      console.error('Failed to export file logs:', error)
      if (error.response?.status === 403) {
        showMessage('You do not have permission to export logs for specific files', 'error')
      } else {
        showMessage(error.response?.data?.message || 'Failed to export logs', 'error')
      }
    } finally {
      exportingFileId.value = null
      // Close the dialog if it's open
      if (fileDetailsDialog.value) {
        fileDetailsDialog.value = false
      }
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    if (authStore.isAuthenticated) {
      fetchDownloadLogs()
    }
  })

  // Watch for changes to filters and view mode
  watch([dateRange, viewMode], () => {
    page.value = 1 // Reset to first page when filters or view mode changes
    fetchDownloadLogs()
  })

  // Watch for auth changes
  authStore.$subscribe(() => {
    if (authStore.isAuthenticated) {
      fetchDownloadLogs()
    }
  })
</script>

<style scoped>
.max-w-200 {
  max-width: 200px;
}
.view-mode-select {
  max-width: 200px;
}
.log-details-pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
