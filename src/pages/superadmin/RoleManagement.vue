<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pe-2">
        Role Management
        <v-spacer />
        <v-btn color="primary" @click="openCreateRoleDialog">Create Role</v-btn>
      </v-card-title>

      <v-text-field
        v-model="search"
        class="pa-4"
        hide-details
        label="Search Roles (Name)"
        prepend-inner-icon="mdi-magnify"
        single-line
        variant="outlined"
        @input="debouncedFetchRoles"
      />

      <v-divider />

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        item-value="name"
        :items="roles"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        @update:options="loadItems"
      >
        <template #item.actions="{ item }">
          <v-icon
            :disabled="isRoleProtected(item.name)"
            small
            @click="openDeleteRoleDialog(item)"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Create/Edit Role Dialog -->
    <v-dialog
      v-model="roleDialogVisible"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ currentRole.id ? 'Edit Role' : 'Create Role' }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentRole.name"
                  :disabled="!!currentRole.id"
                  hint="Role name should be in uppercase with underscores (e.g., ROLE_ADMIN)"
                  label="Role Name"
                  persistent-hint
                  :rules="[rules.required, rules.roleNameFormat]"
                />
              </v-col>
              <!-- TODO: Add permission management here -->
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue darken-1"
            text
            @click="closeRoleDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue darken-1"
            :disabled="!isRoleFormValid"
            text
            @click="saveRole"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Role Dialog -->
    <v-dialog
      v-model="deleteRoleDialogVisible"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete role {{ roleToDelete?.name }}?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue darken-1"
            text
            @click="closeDeleteRoleDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="confirmDeleteRole"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.visible"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { RoleDto } from '@/types/superAdmin'
  import { computed, onMounted, ref } from 'vue'
  import { roleService } from '@/services/superAdminService'
  // import { VDataTableServer } from 'vuetify/labs/VDataTable' // Removed as it should be auto-imported

  // Debounce utility (same as in UserManagement)
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

  const roles = ref<RoleDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalItems = ref(0)
  const itemsPerPage = ref(10)
  const search = ref('')

  const snackbar = ref({
    visible: false,
    text: '',
    color: 'success',
    timeout: 3000,
  })

  const headers = ref([
    { title: 'ID', key: 'id', align: 'start' },
    { title: 'Name', key: 'name' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
  ])

  // Dialog states
  const roleDialogVisible = ref(false)
  const deleteRoleDialogVisible = ref(false)

  const currentRole = ref<Partial<RoleDto>>({ name: '' })
  const roleToDelete = ref<RoleDto | null>(null)

  // Basic validation rules
  const rules = {
    required: (value: string) => !!value || 'Required.',
    roleNameFormat: (value: string) =>
      /^[A-Z_]+$/.test(value) || 'Role name must be uppercase with underscores (e.g., ROLE_EXAMPLE).',
  }

  const isRoleFormValid = computed(() => {
    if (!currentRole.value.name) return false
    return /^[A-Z_]+$/.test(currentRole.value.name)
  })

  // Protected roles that cannot be deleted
  const PROTECTED_ROLES = new Set(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_USER'])

  function isRoleProtected (roleName: string): boolean {
    return PROTECTED_ROLES.has(roleName)
  }

  async function fetchRoles (options?: { page?: number, itemsPerPage?: number, sortBy?: any[], search?: string }) {
    loading.value = true
    error.value = null
    try {
      const params: any = {}
      if (options?.search && options.search.trim() !== '') {
        params.name = options.search.trim() // Assuming API supports search by name
      }
      // Implement server-side pagination/sorting if API supports it
      // params.page = options?.page;
      // params.size = options?.itemsPerPage;
      // if (options?.sortBy?.length) {
      //   params.sort = options.sortBy[0].key + ',' + (options.sortBy[0].order === 'desc' ? 'desc' : 'asc');
      // }

      const allRoles = await roleService.listRoles(params)
      // If API doesn't filter by name, filter client-side (less ideal for large datasets)
      let filteredRoles = allRoles
      if (search.value && search.value.trim() !== '' && !params.name) { // if client-side search is needed
        const searchTerm = search.value.toLowerCase()
        filteredRoles = allRoles.filter(role =>
          role.name.toLowerCase().includes(searchTerm),
        )
      }

      roles.value = filteredRoles
      totalItems.value = filteredRoles.length // Adjust if server-side pagination
    } catch (error_: any) {
      console.error('Failed to fetch roles:', error_)
      const errorMessage = error_.message || 'Failed to load roles.'
      error.value = errorMessage
      roles.value = []
      totalItems.value = 0
      showSnackbar(errorMessage, 'error')
    } finally {
      loading.value = false
    }
  }

  const debouncedFetchRoles = debounce(fetchRoles, 500)

  async function loadItems ({ page, itemsPerPage: ipp, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }) {
    await fetchRoles({ page, itemsPerPage: ipp, sortBy, search: search.value })
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info' = 'success', timeout = 3000) {
    snackbar.value = { visible: true, text, color, timeout }
  }

  // Create/Edit Role
  function openCreateRoleDialog () {
    currentRole.value = { name: '' } // Reset for new role
    roleDialogVisible.value = true
  }

  // Edit is not implemented in this basic version, but structure is here
  // function openEditRoleDialog(role: RoleDto) {
  // currentRole.value = { ...role };
  // roleDialogVisible.value = true;
  // }

  function closeRoleDialog () {
    roleDialogVisible.value = false
    currentRole.value = { name: '' } // Reset
  }

  async function saveRole () {
    if (!isRoleFormValid.value || !currentRole.value.name) {
      showSnackbar('Invalid role name. Please follow the format (e.g., ROLE_EXAMPLE).', 'error')
      return
    }
    loading.value = true
    try {
      // For simplicity, this only handles creation. Edit would need a different call or logic.
      const newRole = await roleService.createRole({ name: currentRole.value.name })
      if (newRole) {
        await fetchRoles() // Refresh list
        showSnackbar('Role created successfully.', 'success')
      } else {
        showSnackbar('Failed to create role.', 'error')
      }
    } catch (error_: any) {
      console.error('Error creating role:', error_)
      showSnackbar(error_.message || 'Error creating role.', 'error')
    } finally {
      loading.value = false
      closeRoleDialog()
    }
  }

  // Delete Role
  function openDeleteRoleDialog (role: RoleDto) {
    if (isRoleProtected(role.name)) {
      showSnackbar(`Role "${role.name}" is protected and cannot be deleted.`, 'error')
      return
    }
    roleToDelete.value = role
    deleteRoleDialogVisible.value = true
  }

  function closeDeleteRoleDialog () {
    deleteRoleDialogVisible.value = false
    roleToDelete.value = null
  }

  async function confirmDeleteRole () {
    if (!roleToDelete.value) return
    if (isRoleProtected(roleToDelete.value.name)) {
      showSnackbar(`Role "${roleToDelete.value.name}" is protected and cannot be deleted.`, 'error')
      closeDeleteRoleDialog()
      return
    }
    loading.value = true
    try {
      await roleService.deleteRole(roleToDelete.value.name)
      await fetchRoles() // Refresh list
      showSnackbar('Role deleted successfully.', 'success')
    } catch (error_: any) {
      console.error('Error deleting role:', error_)
      showSnackbar(error_.message || 'Error deleting role.', 'error')
    } finally {
      loading.value = false
      closeDeleteRoleDialog()
    }
  }

  onMounted(() => {
  // fetchRoles will be called by loadItems initially
  })

</script>

<style scoped>
/* Add any specific styles for role management here */
</style>
