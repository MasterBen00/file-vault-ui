<template>
  <section class="system-settings-section pa-6">
    <div class="d-flex align-center mb-6">
      <v-icon color="primary" size="32">mdi-cog</v-icon>
      <span class="text-h5 font-weight-bold ml-3">System Settings</span>
    </div>
    <v-progress-circular v-if="loading" class="my-4" color="primary" indeterminate />
    <v-alert
      v-else-if="error"
      class="my-4"
      dense
      outlined
      type="error"
    >{{ error }}</v-alert>
    <v-table v-else class="elevation-1 rounded-lg settings-table" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">Setting</th>
          <th class="text-left">Value</th>
          <th class="text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(setting, index) in settings" :key="setting.settingKey">
          <td class="font-weight-medium">{{ formatSettingKey(setting.settingKey) }}</td>
          <td style="min-width: 180px;">
            <template v-if="typeof setting.settingValue === 'boolean' || setting.settingValue === 'true' || setting.settingValue === 'false'">
              <v-select
                v-model="editableSettings[setting.settingKey]"
                class="my-1"
                dense
                :disabled="saving[setting.settingKey]"
                hide-details
                :item-title="item => item ? 'True' : 'False'"
                :item-value="item => item"
                :items="[true, false]"
                variant="outlined"
              />
            </template>
            <template v-else>
              <v-text-field
                v-model="editableSettings[setting.settingKey]"
                class="my-1"
                dense
                :disabled="saving[setting.settingKey]"
                hide-details
                variant="outlined"
              />
            </template>
          </td>
          <td>
            <v-tooltip location="top">
              <template #activator="{ props }">
                <span v-bind="props">
                  <v-btn
                    :aria-label="'Save ' + formatSettingKey(setting.settingKey)"
                    class="rounded-pill px-4"
                    color="primary"
                    :disabled="isValueUnchanged(settings[index].settingValue, editableSettings[setting.settingKey]) || saving[setting.settingKey]"
                    :loading="saving[setting.settingKey]"
                    size="small"
                    variant="elevated"
                    @click="saveSetting(setting.settingKey)"
                  >
                    <v-icon start>mdi-content-save-check</v-icon>
                    Save
                  </v-btn>
                </span>
              </template>
              <span>Save changes</span>
            </v-tooltip>
          </td>
        </tr>
      </tbody>
    </v-table>
    <p v-if="settings.length === 0 && !loading" class="text-center my-4">No system settings found.</p>
    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
    </v-snackbar>
  </section>
</template>

<script setup lang="ts">
  import type { SystemSettingDto } from '@/types/superAdmin'
  import { onMounted, reactive, ref } from 'vue'
  import { systemSettingsService } from '@/services/superAdminService'

  const settings = ref<SystemSettingDto[]>([])
  const editableSettings = reactive<Record<string, any>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const saving = reactive<Record<string, boolean>>({})

  const snackbar = ref({
    visible: false,
    text: '',
    color: 'success',
    timeout: 3000,
  })

  function formatSettingKey (key: string): string {
    if (!key) return ''
    // Replace dots with spaces, then capitalize each word
    return key
      .replace(/\./g, ' ')
      .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters for camelCase or PascalCase parts
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  async function fetchSystemSettings () {
    loading.value = true
    error.value = null
    try {
      const fetchedSettings = await systemSettingsService.listSystemSettings()

      // Sort settings alphabetically by settingKey
      fetchedSettings.sort((a, b) => {
        if (a.settingKey < b.settingKey) {
          return -1
        }
        if (a.settingKey > b.settingKey) {
          return 1
        }
        return 0
      })

      settings.value = fetchedSettings
      // Initialize editableSettings and saving state
      for (const setting of fetchedSettings) {
        // Convert string "true"/"false" values to actual booleans
        if (setting.settingValue === "true" || setting.settingValue === "false") {
          editableSettings[setting.settingKey] = setting.settingValue === "true";
        } else {
          editableSettings[setting.settingKey] = setting.settingValue;
        }
        saving[setting.settingKey] = false
      }
    } catch (error_: any) {
      console.error('Failed to fetch system settings:', error_)
      error.value = error_.message || 'Failed to load system settings.'
      showSnackbar(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  async function saveSetting (key: string) {
    if (editableSettings[key] === undefined) {
      showSnackbar('Cannot save undefined value.', 'error')
      return
    }

    saving[key] = true
    const originalSetting = settings.value.find(s => s.settingKey === key)
    if (!originalSetting) {
      showSnackbar('Original setting not found.', 'error')
      saving[key] = false
      return
    }

    try {
      // Convert boolean values back to strings for the API
      let settingValue = editableSettings[key]
      if (typeof settingValue === 'boolean') {
        settingValue = settingValue.toString()
      }

      const payload: SystemSettingDto = { settingKey: key, settingValue: settingValue }
      const updatedSetting = await systemSettingsService.updateSystemSetting(payload)
      if (updatedSetting) {
        // Update the original settings ref to reflect the change and disable save button until further edits
        const settingIndex = settings.value.findIndex(s => s.settingKey === key)
        if (settingIndex !== -1) {
          settings.value[settingIndex] = { ...updatedSetting }
        }
        showSnackbar(`Setting "${key}" updated successfully.`, 'success')
      } else {
        // Restore original value if update failed but didn't throw
        editableSettings[key] = originalSetting.settingValue
        showSnackbar(`Failed to update setting "${key}".`, 'error')
      }
    } catch (error_: any) {
      console.error(`Error updating setting ${key}:`, error_)
      // Restore original value on error
      editableSettings[key] = originalSetting.settingValue
      showSnackbar(error_.message || `Error updating setting "${key}".`, 'error')
    } finally {
      saving[key] = false
    }
  }

  function isValueUnchanged(originalValue: any, newValue: any): boolean {
    // Handle comparing string booleans with actual booleans
    if (originalValue === 'true' && newValue === true) {
      return true;
    }
    if (originalValue === 'false' && newValue === false) {
      return true;
    }
    // For all other cases, do direct comparison
    return originalValue === newValue;
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info' = 'success', timeout = 3000) {
    snackbar.value = { visible: true, text, color, timeout }
  }

  onMounted(() => {
    fetchSystemSettings()
  })
</script>

<style scoped>
.system-settings-section {
  min-height: 100vh;
  background-color: var(--v-theme-background);
  transition: background-color 0.2s;
}
.settings-table {
  background-color: var(--v-theme-surface);
  transition: background-color 0.2s;
}
:deep(.v-table thead) {
  background: var(--v-theme-surface-variant);
}
:deep(.v-table th), :deep(.v-table td) {
  border-bottom: 1px solid var(--v-theme-outline-variant);
}
</style>
