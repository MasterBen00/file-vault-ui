<template>
  <v-container fluid>
    <v-card>
      <v-card-title>Audit Log Viewer</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.adminUsername"
              clearable
              dense
              label="Admin Username"
              variant="outlined"
              @update:model-value="debouncedFetchAuditLogs"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.actionType"
              clearable
              dense
              label="Action Type"
              variant="outlined"
              @update:model-value="debouncedFetchAuditLogs"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.targetEntityType"
              clearable
              dense
              label="Target Entity Type"
              variant="outlined"
              @update:model-value="debouncedFetchAuditLogs"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.targetEntityId"
              clearable
              dense
              label="Target Entity ID"
              variant="outlined"
              @update:model-value="debouncedFetchAuditLogs"
            />
          </v-col>
          <!-- TODO: Add Date Range Pickers for startDate and endDate -->
        </v-row>

        <v-data-table-server
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          item-value="id"
          :items="auditLogs"
          :items-length="totalItems"
          :loading="loading"
          @update:options="loadItems"
        >
          <template #item.timestamp="{ item }">
            {{ new Date(item.timestamp).toLocaleString() }}
          </template>
          <template #item.details="{ item }">
            <v-dialog max-width="600">
              <template #activator="{ props: activatorProps }">
                <v-btn v-bind="activatorProps" color="primary" small variant="text">View</v-btn>
              </template>
              <template #default="{ isActive }">
                <v-card title="Log Details">
                  <v-card-text>
                    <pre style="white-space: pre-wrap; word-break: break-all;">{{ item.details }}</pre>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="isActive.value = false">Close</v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup lang="ts">
  import type { AdminAuditLogDto } from '@/types/superAdmin'
  import { onMounted, reactive, ref, watch } from 'vue'
  import { auditLogService } from '@/services/superAdminService'
  // import { VDataTableServer } from 'vuetify/labs/VDataTable'; // Auto-imported

  // Debounce utility
  function debounce<F extends (...args: any[]) => any> (func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null
    const debounced = (...args: Parameters<F>) => {
      if (timeout !== null) {
        clearTimeout(timeout)
        timeout = null
      }
      timeout = setTimeout(() => func(...args), waitFor)
    }
    return debounced as (...args: Parameters<F>) => ReturnType<F>
  }

  const auditLogs = ref<AdminAuditLogDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalItems = ref(0)
  const itemsPerPage = ref(10)

  const filters = reactive({
    adminUsername: '',
    actionType: '',
    targetEntityType: '',
    targetEntityId: '',
    startDate: '' as string | null, // Placeholder for date picker
    endDate: '' as string | null, // Placeholder for date picker
  })

  const snackbar = ref({
    visible: false,
    text: '',
    color: 'success',
    timeout: 3000,
  })

  const headers = ref([
    { title: 'ID', key: 'id', align: 'start' },
    { title: 'Timestamp', key: 'timestamp' },
    { title: 'Admin Username', key: 'adminUsername' },
    { title: 'Action Type', key: 'actionType' },
    { title: 'Target Entity Type', key: 'targetEntityType' },
    { title: 'Target Entity ID', key: 'targetEntityId' },
    { title: 'Details', key: 'details', sortable: false, align: 'center' },
  ])

  async function fetchAuditLogs (options?: { page?: number, itemsPerPage?: number, sortBy?: any[] }) {
    loading.value = true
    error.value = null
    try {
      const apiParams: Record<string, any> = {
      // page: options?.page, // For server-side pagination
      // size: options?.itemsPerPage, // For server-side pagination
      }
      if (options?.sortBy?.length) {
        apiParams.sort = options.sortBy[0].key + ',' + (options.sortBy[0].order === 'desc' ? 'desc' : 'asc')
      }

      // Add active filters to params
      for (const [key, value] of Object.entries(filters)) {
        if (value !== '' && value !== null) {
          apiParams[key] = value
        }
      }

      // For now, client-side pagination and filtering based on fetched data if API doesn't support all filters
      // Ideally, the API handles all filtering, pagination, and sorting.
      const allLogs = await auditLogService.listAuditLogs(apiParams)

      // This client-side filtering is a fallback if API doesn't support all filter fields directly
      // or if you want to refine further on client-side (not usually needed if API is robust)
      const processedLogs = allLogs.filter(log => {
        return (!filters.adminUsername || log.adminUsername.toLowerCase().includes(filters.adminUsername.toLowerCase()))
          && (!filters.actionType || log.actionType.toLowerCase().includes(filters.actionType.toLowerCase()))
          && (!filters.targetEntityType || log.targetEntityType.toLowerCase().includes(filters.targetEntityType.toLowerCase()))
          && (!filters.targetEntityId || log.targetEntityId.toLowerCase().includes(filters.targetEntityId.toLowerCase()))
      })

      // Sorting (VDataTableServer might handle this client-side if server doesn't sort)
      if (options?.sortBy?.length) {
        const sortKey = options.sortBy[0].key as keyof AdminAuditLogDto
        const sortOrder = options.sortBy[0].order
        processedLogs.sort((a, b) => {
          let valA = a[sortKey]
          let valB = b[sortKey]
          if (typeof valA === 'string') valA = valA.toLowerCase()
          if (typeof valB === 'string') valB = valB.toLowerCase()
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1
          return 0
        })
      }

      auditLogs.value = processedLogs
      totalItems.value = processedLogs.length // Adjust if server-side pagination gives total
    } catch (error_: any) {
      console.error('Failed to fetch audit logs:', error_)
      const errorMessage = error_.message || 'Failed to load audit logs.'
      error.value = errorMessage
      auditLogs.value = []
      totalItems.value = 0
      showSnackbar(errorMessage, 'error')
    } finally {
      loading.value = false
    }
  }

  const debouncedFetchAuditLogs = debounce(fetchAuditLogs, 500)

  async function loadItems ({ page, itemsPerPage: ipp, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }) {
    // Pass current filters along with pagination/sorting options
    await fetchAuditLogs({ page, itemsPerPage: ipp, sortBy })
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info' = 'success', timeout = 3000) {
    snackbar.value = { visible: true, text, color, timeout }
  }

  // Watch filters to refetch logs
  // watch(filters, () => {
  //   debouncedFetchAuditLogs(); // Call with current pagination/sort options if needed
  // }, { deep: true });

  onMounted(() => {
  // fetchAuditLogs will be called by loadItems initially
  })

</script>

<style scoped>
pre {
  white-space: pre-wrap; /* CSS3 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
</style>
