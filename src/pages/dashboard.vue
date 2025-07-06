<template>
  <v-container>
    <h1 class="text-h4 my-4">Admin Dashboard</h1>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="d-flex flex-column align-center my-8">
      <v-progress-circular color="primary" indeterminate size="64" />
      <span class="mt-4">Loading dashboard data...</span>
    </div>

    <div v-else>
      <!-- Top Stats Cards Row -->
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-item>
              <div>
                <div class="text-overline mb-1">Files</div>
                <div class="d-flex align-center">
                  <h3 class="text-h3 font-weight-bold">{{ formatNumber(basicStats.totalFiles) }}</h3>
                  <v-chip class="ml-4" color="success">{{ formatNumber(basicStats.activeFiles) }} Active</v-chip>
                  <v-chip class="ml-2" color="error">{{ formatNumber(basicStats.expiredFiles) }} Expired</v-chip>
                </div>
              </div>
              <template #append>
                <v-avatar color="primary" rounded>
                  <v-icon>mdi-file-multiple</v-icon>
                </v-avatar>
              </template>
            </v-card-item>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-item>
              <div>
                <div class="text-overline mb-1">Downloads</div>
                <div class="d-flex align-center">
                  <h3 class="text-h3 font-weight-bold">{{ formatNumber(basicStats.totalDownloads) }}</h3>
                  <v-chip class="ml-4" color="info">{{ formatNumber(basicStats.downloadsLast24Hours) }} Today</v-chip>
                </div>
              </div>
              <template #append>
                <v-avatar color="info" rounded>
                  <v-icon>mdi-download</v-icon>
                </v-avatar>
              </template>
            </v-card-item>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-item>
              <div>
                <div class="text-overline mb-1">Password Protected</div>
                <div class="d-flex align-center">
                  <h3 class="text-h3 font-weight-bold">{{ formatNumber(passwordStats.passwordProtectedFiles) }}</h3>
                  <v-chip class="ml-4" :color="passwordStats.percentageProtected > 50 ? 'warning' : 'success'">
                    {{ passwordStats.percentageProtected }}% Protected
                  </v-chip>
                </div>
              </div>
              <template #append>
                <v-avatar color="warning" rounded>
                  <v-icon>mdi-lock</v-icon>
                </v-avatar>
              </template>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>

      <!-- User and Storage Stats Row -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between align-center">
              User Statistics
              <v-avatar color="primary" size="32">
                <v-icon>mdi-account-group</v-icon>
              </v-avatar>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-h5">{{ formatNumber(userStats.totalUsers) }}</div>
                    <div class="text-caption">Total Users</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-h5">{{ formatNumber(userStats.activeUsersLast30Days) }}</div>
                    <div class="text-caption">Active Users</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-h5">{{ formatNumber(userStats.inactiveUsers) }}</div>
                    <div class="text-caption">Inactive Users</div>
                  </div>
                </v-col>
              </v-row>
              <v-progress-linear
                color="primary"
                height="20"
                :model-value="(userStats.activeUsersLast30Days / userStats.totalUsers) * 100"
                striped
              >
                <template #default="{ value }">
                  <strong>{{ Math.ceil(value) }}% Active</strong>
                </template>
              </v-progress-linear>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between align-center">
              Total Storage Used
              <v-avatar color="info" size="32">
                <v-icon>mdi-database</v-icon>
              </v-avatar>
            </v-card-title>
            <v-card-text class="text-center py-6">
              <div class="text-h3 font-weight-bold mb-2">{{ formatBytes(storageUsed) }}</div>
              <div class="text-caption">across all files and users</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Dashboard Content -->
      <v-row>
        <!-- Left Column -->
        <v-col cols="12" md="7">
          <!-- Download Trend Chart -->
          <v-card class="mb-4">
            <v-card-title>Download Trend (Last 7 Days)</v-card-title>
            <v-card-text>
              <canvas id="downloadTrendChart" ref="chartCanvas" height="180" />
            </v-card-text>
          </v-card>

          <!-- Recent Downloads -->
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between align-center">
              Recent Downloads
              <v-btn color="primary" size="small" variant="text" @click="refreshRecentDownloads">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Downloaded By</th>
                    <th>Time</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="download in recentDownloads" :key="download.id">
                    <td>{{ download.fileName }}</td>
                    <td>{{ download.downloaderUsername || download.downloaderUserId || 'Anonymous' }}</td>
                    <td>{{ formatDateTime(download.downloadTime) }}</td>
                    <td>{{ download.downloaderIp }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

          <!-- Files Expiring Soon -->
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between align-center">
              Files Expiring Soon
              <div>
                <v-select
                  v-model="expiryDays"
                  class="expiry-days-select"
                  density="compact"
                  hide-details
                  :items="[3, 7, 14, 30]"
                  label="Days"
                  variant="outlined"
                  @update:model-value="fetchFilesExpiringSoon"
                />
              </div>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-list v-if="!isLoadingExpiring && filesExpiringSoon.length > 0">
                <v-list-item v-for="file in filesExpiringSoon" :key="file.id">
                  <v-list-item-title>{{ file.originalFileName }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Uploaded by {{ file.uploaderUsername }} • Expires {{ formatDate(file.expiryTime) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center">
                      <v-chip class="mr-2" color="warning" size="small">
                        {{ calculateDaysLeft(file.expiryTime) }} days left
                      </v-chip>
                      <v-chip class="mr-2" :color="file.passwordProtected ? 'error' : 'success'" size="small">
                        {{ file.passwordProtected ? 'Protected' : 'Open' }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else-if="isLoadingExpiring" class="d-flex justify-center py-4">
                <v-progress-circular indeterminate />
              </div>
              <v-alert v-else class="ma-4" type="info">No files expiring soon.</v-alert>
            </v-card-text>
          </v-card>

          <!-- Redownload Requests -->
          <v-card class="mb-4">
            <v-card-title>Pending Redownload Requests</v-card-title>
            <v-card-text class="pa-0">
              <v-list v-if="!isLoadingRedownloadRequests && redownloadRequests.length > 0">
                <v-list-item v-for="file in redownloadRequests" :key="file.id">
                  <v-list-item-title>{{ file.originalFileName }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Requested by {{ file.redownloadRequestedBy }} on {{ formatDate(file.redownloadRequestTime) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div>
                      <v-btn class="mr-2" color="success" size="small">Approve</v-btn>
                      <v-btn color="error" size="small">Reject</v-btn>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else-if="isLoadingRedownloadRequests" class="d-flex justify-center py-4">
                <v-progress-circular indeterminate />
              </div>
              <v-alert v-else class="ma-4" type="info">No pending redownload requests.</v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column -->
        <v-col cols="12" md="5">
          <!-- Top Downloaded Files -->
          <v-card class="mb-4">
            <v-card-title>Top Downloaded Files</v-card-title>
            <v-card-text class="pa-0">
              <v-list>
                <v-list-item v-for="(file, index) in topDownloadedFiles" :key="index">
                  <template #prepend>
                    <v-avatar color="primary" size="36">
                      {{ index + 1 }}
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ file.fileName }}</v-list-item-title>
                  <template #append>
                    <v-chip color="info">{{ formatNumber(file.downloadCount) }} downloads</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Storage by Uploader -->
          <v-card class="mb-4">
            <v-card-title>Storage by Uploader</v-card-title>
            <v-card-text class="pa-0">
              <v-list>
                <v-list-item v-for="uploader in storageByUploader" :key="uploader.uploaderUsername">
                  <v-list-item-title>{{ uploader.uploaderUsername }}</v-list-item-title>
                  <template #append>
                    <v-chip color="secondary">{{ formatBytes(uploader.storageUsed) }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Files at Max Downloads -->
          <v-card class="mb-4">
            <v-card-title>Files at Maximum Downloads</v-card-title>
            <v-card-text class="pa-0">
              <v-list v-if="!isLoadingMaxDownloads && filesMaxDownloads.length > 0">
                <v-list-item v-for="file in filesMaxDownloads" :key="file.id">
                  <v-list-item-title>{{ file.originalFileName }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ file.downloadCount }}/{{ file.maxDownloads }} downloads
                  </v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="file.passwordProtected ? 'warning' : 'success'" size="small">
                      {{ file.passwordProtected ? 'Protected' : 'Open' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else-if="isLoadingMaxDownloads" class="d-flex justify-center py-4">
                <v-progress-circular indeterminate />
              </div>
              <v-alert v-else class="ma-4" type="info">No files at maximum downloads.</v-alert>
            </v-card-text>
          </v-card>

          <!-- Organizations Stats -->
          <v-card class="mb-4">
            <v-card-title>Organization Statistics</v-card-title>
            <v-card-text>
              <p class="text-subtitle-1">Total Organizations: {{ formatNumber(orgStats.totalOrganizations) }}</p>
              <v-divider class="my-2" />
              <div class="text-subtitle-2 mb-2">Top Organizations by Storage</div>
              <v-list density="compact">
                <v-list-item v-for="org in orgStats.storageByOrganization.slice(0, 3)" :key="org.name">
                  <v-list-item-title>{{ org.name }}</v-list-item-title>
                  <template #append>
                    <v-chip color="secondary" size="small">{{ formatBytes(org.storageUsed) }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <v-divider class="my-2" />
              <div class="text-subtitle-2 mb-2">Top Organizations by Files</div>
              <v-list density="compact">
                <v-list-item v-for="org in orgStats.filesCountByOrganization.slice(0, 3)" :key="org.name">
                  <v-list-item-title>{{ org.name }}</v-list-item-title>
                  <template #append>
                    <v-chip color="info" size="small">{{ formatNumber(org.fileCount) }} files</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import axios from 'axios'
  import Chart from 'chart.js/auto'
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router/auto'
  import { useAuthStore } from '@/stores/authStore'

  const router = useRouter()
  const authStore = useAuthStore()

  // Loading states
  const isLoading = ref(true)
  const isLoadingExpiring = ref(false)
  const isLoadingMaxDownloads = ref(false)
  const isLoadingRedownloadRequests = ref(false)

  // Dashboard data
  const basicStats = ref({
    totalFiles: 0,
    activeFiles: 0,
    expiredFiles: 0,
    totalDownloads: 0,
    downloadsLast24Hours: 0,
  })

  const userStats = ref({
    totalUsers: 0,
    activeUsersLast30Days: 0,
    inactiveUsers: 0,
  })

  const passwordStats = ref({
    totalFiles: 0,
    passwordProtectedFiles: 0,
    percentageProtected: 0,
  })

  const storageUsed = ref(0)
  const storageByUploader = ref<Array<{ uploaderUsername: string, storageUsed: number }>>([])
  const topDownloadedFiles = ref<Array<{ fileName: string, downloadCount: number }>>([])
  const recentDownloads = ref<any[]>([])
  const downloadTrend = ref<Array<{ downloadDate: string, downloadCount: number }>>([])
  const expiryDays = ref(7)
  const filesExpiringSoon = ref<any[]>([])
  const filesMaxDownloads = ref<any[]>([])
  const redownloadRequests = ref<any[]>([])
  const orgStats = ref({
    totalOrganizations: 0,
    storageByOrganization: [] as Array<{ name: string, storageUsed: number }>,
    filesCountByOrganization: [] as Array<{ name: string, fileCount: number }>,
  })

  // Chart instance
  let downloadTrendChart: Chart | null = null

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    isLoading.value = true

    try {
      await Promise.all([
        fetchBasicStats(),
        fetchUserStats(),
        fetchPasswordStats(),
        fetchStorageUsed(),
        fetchStorageByUploader(),
        fetchTopDownloadedFiles(),
        fetchRecentDownloads(),
        fetchDownloadTrend(),
        fetchFilesExpiringSoon(),
        fetchFilesMaxDownloads(),
        fetchRedownloadRequests(),
        fetchOrgStats(),
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Individual API calls
  const fetchBasicStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      basicStats.value = response.data
    } catch (error) {
      console.error('Error fetching basic stats:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/user-stats', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      userStats.value = response.data
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchPasswordStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/password-protected-stats', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      passwordStats.value = response.data
    } catch (error) {
      console.error('Error fetching password stats:', error)
    }
  }

  const fetchStorageUsed = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/storage-used', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      storageUsed.value = response.data
    } catch (error) {
      console.error('Error fetching storage used:', error)
    }
  }

  const fetchStorageByUploader = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/storage-by-uploader', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      storageByUploader.value = response.data
    } catch (error) {
      console.error('Error fetching storage by uploader:', error)
    }
  }

  const fetchTopDownloadedFiles = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/top-downloaded', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      topDownloadedFiles.value = response.data
    } catch (error) {
      console.error('Error fetching top downloaded files:', error)
    }
  }

  const fetchRecentDownloads = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/recent-downloads', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      recentDownloads.value = response.data
    } catch (error) {
      console.error('Error fetching recent downloads:', error)
    }
  }

  const refreshRecentDownloads = async () => {
    await fetchRecentDownloads()
  }

  const fetchDownloadTrend = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/download-trend', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      downloadTrend.value = response.data
      renderDownloadTrendChart()
    } catch (error) {
      console.error('Error fetching download trend:', error)
    }
  }

  const fetchFilesExpiringSoon = async () => {
    isLoadingExpiring.value = true
    try {
      const response = await axios.get(`/api/admin/dashboard/files-expiring-soon?days=${expiryDays.value}`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      filesExpiringSoon.value = response.data
    } catch (error) {
      console.error('Error fetching files expiring soon:', error)
    } finally {
      isLoadingExpiring.value = false
    }
  }

  const fetchFilesMaxDownloads = async () => {
    isLoadingMaxDownloads.value = true
    try {
      const response = await axios.get('/api/admin/dashboard/files-max-downloads', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      filesMaxDownloads.value = response.data
    } catch (error) {
      console.error('Error fetching files at max downloads:', error)
    } finally {
      isLoadingMaxDownloads.value = false
    }
  }

  const fetchRedownloadRequests = async () => {
    isLoadingRedownloadRequests.value = true
    try {
      const response = await axios.get('/api/admin/dashboard/redownload-requests', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      redownloadRequests.value = response.data
    } catch (error) {
      console.error('Error fetching redownload requests:', error)
    } finally {
      isLoadingRedownloadRequests.value = false
    }
  }

  const fetchOrgStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/organization-stats', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      })
      orgStats.value = response.data
    } catch (error) {
      console.error('Error fetching organization stats:', error)
    }
  }

  // Chart rendering
  const chartCanvas = ref<HTMLCanvasElement | null>(null)
  const renderDownloadTrendChart = () => {
    // Make sure the canvas reference exists
    if (!chartCanvas.value) {
      console.warn('Cannot render chart: canvas reference not found')
      return
    }

    // Clean up existing chart if it exists
    if (downloadTrendChart) {
      downloadTrendChart.destroy()
      downloadTrendChart = null
    }

    // Make sure we have data to display
    if (!downloadTrend.value || downloadTrend.value.length === 0) {
      console.warn('Cannot render chart: no download trend data available')
      return
    }

    // Create new chart
    downloadTrendChart = new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        labels: downloadTrend.value.map(item => {
          const date = new Date(item.downloadDate)
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }),
        datasets: [{
          label: 'Downloads',
          data: downloadTrend.value.map(item => item.downloadCount),
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    })
  }

  watch(downloadTrend, newData => {
    if (newData.length > 0 && chartCanvas.value) {
      renderDownloadTrendChart()
    }
  })

  // Utility functions
  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat().format(number)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const calculateDaysLeft = (dateString: string): number => {
    const expiryDate = new Date(dateString)
    const currentDate = new Date()
    const diffTime = expiryDate.getTime() - currentDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Logout handler
  const handleLogout = () => {
    authStore.logout()
    router.push('/login')
  }

  onMounted(() => {
    fetchDashboardData()

    setTimeout(() => {
      if (downloadTrend.value.length > 0) {
        renderDownloadTrendChart()
      }
    }, 100)
  })

  onBeforeUnmount(() => {
    if (downloadTrendChart) {
      downloadTrendChart.destroy()
    }
  })
</script>

<style scoped>
.expiry-days-select {
  max-width: 100px;
}
</style>
