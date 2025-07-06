<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Super Admin Dashboard</v-card-title>
          <v-card-text>
            <p>Welcome to the Super Admin Dashboard.</p>
            <!-- Quick Access Links will be added here later if requested -->
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Statistics -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card color="primary" dark>
          <v-card-title class="text-h6">Total Users</v-card-title>
          <v-card-text class="text-h5 white--text">{{ userStats.total }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="green" dark>
          <v-card-title class="text-h6">Active Users</v-card-title>
          <v-card-text class="text-h5 white--text">{{ userStats.active }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="red" dark>
          <v-card-title class="text-h6">Disabled Users</v-card-title>
          <v-card-text class="text-h5 white--text">{{ userStats.disabled }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="secondary" dark>
          <v-card-title class="text-h6">Total Organizations</v-card-title>
          <v-card-text class="text-h5 white--text">{{ organizationCount }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="purple" dark>
          <v-card-title class="text-h6">Total Roles</v-card-title>
          <v-card-text class="text-h5 white--text">{{ roleCount }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Key System Settings -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Key System Settings</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item>
                <v-list-item-title>User Registration Allowed</v-list-item-title>
                <template #append>
                  <v-chip :color="keySettings.userRegistrationAllowed === 'true' ? 'green' : 'red'" dark>
                    {{ keySettings.userRegistrationAllowed === 'true' ? 'Yes' : 'No' }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Site Maintenance Mode</v-list-item-title>
                <template #append>
                  <v-chip :color="keySettings.maintenanceMode === 'true' ? 'orange' : 'green'" dark>
                    {{ keySettings.maintenanceMode === 'true' ? 'Active' : 'Inactive' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-progress-circular v-if="loadingKeySettings" color="primary" indeterminate />
            <v-alert v-if="keySettingsError" type="error">{{ keySettingsError }}</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Recent Activity
            <v-btn color="primary" :to="{ name: 'SuperAdminAuditLogs' }" variant="text">View All</v-btn>
          </v-card-title>
          <v-card-text>
            <v-progress-circular v-if="loadingRecentActivity" color="primary" indeterminate />
            <v-alert v-else-if="recentActivityError" dense outlined type="error">{{ recentActivityError }}</v-alert>
            <v-list v-else-if="recentActivityLogs.length > 0" dense>
              <v-list-item
                v-for="log in recentActivityLogs"
                :key="log.id"
                @click="openLogDetailsDialog(log)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    <strong>{{ log.actionType }}</strong> on {{ log.targetEntityType }} (ID: {{ log.targetEntityId }}) by {{ log.adminUsername }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ new Date(log.timestamp).toLocaleString() }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <p v-else>No recent activity found.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Log Details Dialog -->
    <v-dialog v-model="logDetailsDialogVisible" max-width="600px">
      <v-card>
        <v-card-title>Log Details</v-card-title>
        <v-card-text v-if="selectedLog">
          <p><strong>ID:</strong> {{ selectedLog.id }}</p>
          <p><strong>Timestamp:</strong> {{ new Date(selectedLog.timestamp).toLocaleString() }}</p>
          <p><strong>Admin:</strong> {{ selectedLog.adminUsername }}</p>
          <p><strong>Action:</strong> {{ selectedLog.actionType }}</p>
          <p><strong>Entity Type:</strong> {{ selectedLog.targetEntityType }}</p>
          <p><strong>Entity ID:</strong> {{ selectedLog.targetEntityId }}</p>
          <p><strong>Details:</strong></p>
          <pre>{{ selectedLog.details }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="logDetailsDialogVisible = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
  import type { AdminAuditLogDto, SystemSettingDto, UserInfoDto } from '@/types/superAdmin'
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { auditLogService, organizationService, roleService, systemSettingsService, userService } from '@/services/superAdminService'

  const router = useRouter()

  const userStats = ref({ total: 'Loading...', active: 'Loading...', disabled: 'Loading...' })
  const organizationCount = ref<number | string>('Loading...')
  const roleCount = ref<number | string>('Loading...')
  const recentActivityLogs = ref<AdminAuditLogDto[]>([])
  const keySettings = ref<Record<string, string | null>>({
    userRegistrationAllowed: null,
    maintenanceMode: null,
  })

  const loadingStats = ref(false)
  const statsError = ref<string | null>(null)
  const loadingRecentActivity = ref(false)
  const recentActivityError = ref<string | null>(null)
  const loadingKeySettings = ref(false)
  const keySettingsError = ref<string | null>(null)

  const logDetailsDialogVisible = ref(false)
  const selectedLog = ref<AdminAuditLogDto | null>(null)

  async function fetchDashboardStats () {
    loadingStats.value = true
    statsError.value = null
    try {
      const [users, organizations, roles] = await Promise.all([
        userService.listUsers(),
        organizationService.listOrganizations(),
        roleService.listRoles(),
      ])

      userStats.value.total = users.length.toString()
      userStats.value.active = users.filter(u => u.isActive).length.toString()
      userStats.value.disabled = users.filter(u => !u.isActive).length.toString()

      organizationCount.value = organizations.length
      roleCount.value = roles.length
    } catch (error_: any) {
      console.error('Failed to fetch dashboard stats:', error_)
      statsError.value = error_.message || 'Failed to load dashboard statistics.'
      userStats.value = { total: 'Error', active: 'Error', disabled: 'Error' }
      organizationCount.value = 'Error'
      roleCount.value = 'Error'
    }
    loadingStats.value = false
  }

  async function fetchRecentActivity () {
    loadingRecentActivity.value = true
    recentActivityError.value = null
    try {
      const logs = await auditLogService.listAuditLogs()
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      recentActivityLogs.value = logs.slice(0, 5)
    } catch (error_: any) {
      console.error('Failed to fetch recent activity:', error_)
      recentActivityError.value = error_.message || 'Failed to load recent activity.'
    }
    loadingRecentActivity.value = false
  }

  async function fetchKeySystemSettings () {
    loadingKeySettings.value = true
    keySettingsError.value = null
    try {
      const settingsToFetch = ['user.registration.allowNew', 'general.site.maintenanceMode']
      const fetchedSettings: Record<string, string | null> = {}
      for (const key of settingsToFetch) {
        try {
          const setting = await systemSettingsService.getSystemSettingByKey(key)
          fetchedSettings[key.replace(/\./g, '')] = setting ? setting.settingValue : 'Not Set'
        } catch (error) {
          console.warn(`Could not fetch setting: ${key}`, error)
          fetchedSettings[key.replace(/\./g, '')] = 'Error'
        }
      }
      keySettings.value.userRegistrationAllowed = fetchedSettings.userregistrationallowNew || 'Error'
      keySettings.value.maintenanceMode = fetchedSettings.generalsitemaintenanceMode || 'Error'
    } catch (error_: any) {
      console.error('Failed to fetch key system settings:', error_)
      keySettingsError.value = error_.message || 'Failed to load key system settings.'
      keySettings.value.userRegistrationAllowed = 'Error'
      keySettings.value.maintenanceMode = 'Error'
    }
    loadingKeySettings.value = false
  }

  function openLogDetailsDialog (log: AdminAuditLogDto) {
    selectedLog.value = log
    logDetailsDialogVisible.value = true
  }

  onMounted(() => {
    fetchDashboardStats()
    fetchRecentActivity()
    fetchKeySystemSettings()
  })
</script>

<style scoped>
.white--text {
  color: white !important;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f5f5; /* Light grey background for pre */
  padding: 10px;
  border-radius: 4px;
}
</style>
