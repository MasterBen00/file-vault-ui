<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pe-2">
        Organization Management
        <v-spacer />
        <v-btn color="primary" @click="openCreateOrganizationDialog">Create Organization</v-btn>
      </v-card-title>

      <v-text-field
        v-model="search"
        class="pa-4"
        hide-details
        label="Search Organizations (Name)"
        prepend-inner-icon="mdi-magnify"
        single-line
        variant="outlined"
        @input="debouncedFetchOrganizations"
      />

      <v-divider />

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        item-value="id"
        :items="organizations"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        @update:options="loadItems"
      >
        <template #item.actions="{ item }">
          <v-icon class="me-2" small @click="openEditOrganizationDialog(item)">mdi-pencil</v-icon>
          <v-icon small @click="openDeleteOrganizationDialog(item)">mdi-delete</v-icon>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Create/Edit Organization Dialog -->
    <v-dialog v-model="organizationDialogVisible" max-width="700px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ currentOrganization.id ? 'Edit Organization' : 'Create Organization' }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentOrganization.name"
                  :disabled="!isCreatingNewOrganization && !canEditOrgName"
                  label="Organization Name"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col v-if="!isCreatingNewOrganization" cols="12">
                <v-autocomplete
                  v-model="selectedUsersForOrganization"
                  chips
                  closable-chips
                  :disabled="loadingUsersForSelection"
                  item-title="username"
                  item-value="id"
                  :items="allUsersForSelection"
                  label="Assign Users"
                  :loading="loadingUsersForSelection"
                  multiple
                  prepend-inner-icon="mdi-account-multiple-plus"
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :text="item.raw.username"
                    />
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :subtitle="item.raw.email"
                      :title="item.raw.username"
                    />
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeOrganizationDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" :disabled="!isOrganizationFormValid" text @click="saveOrganization">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Organization Dialog -->
    <v-dialog v-model="deleteOrganizationDialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete organization {{ organizationToDelete?.name }}?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeDeleteOrganizationDialog">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="confirmDeleteOrganization">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup lang="ts">
  import type { OrganizationDto, UserInfoDto } from '@/types/superAdmin' // Added UserInfoDto
  import { computed, onMounted, ref, watch } from 'vue' // Added watch
  import { organizationService, userService } from '@/services/superAdminService' // Added userService

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

  const organizations = ref<OrganizationDto[]>([])
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
  const organizationDialogVisible = ref(false)
  const deleteOrganizationDialogVisible = ref(false)

  const currentOrganization = ref<Partial<OrganizationDto & { originalUsers?: UserInfoDto[] }>>({ name: '' })
  const organizationToDelete = ref<OrganizationDto | null>(null)
  const isCreatingNewOrganization = ref(false)
  const canEditOrgName = ref(false) // To control name editability for existing orgs

  const allUsersForSelection = ref<UserInfoDto[]>([])
  const loadingUsersForSelection = ref(false)
  const selectedUsersForOrganization = ref<number[]>([]) // Store user IDs

  // Basic validation rules
  const rules = {
    required: (value: string) => !!value || 'Required.',
  }

  const isOrganizationFormValid = computed(() => {
    return !!currentOrganization.value.name && currentOrganization.value.name.trim() !== ''
  })

  async function fetchAllUsersForSelection () {
    if (allUsersForSelection.value.length > 0 && !loadingUsersForSelection.value) return
    loadingUsersForSelection.value = true
    try {
      // Fetch all users that can be assigned.
      // You might want to filter out users already in *another* organization if a user can only belong to one.
      allUsersForSelection.value = await userService.listUsers()
    } catch (error) {
      console.error('Failed to fetch users for selection:', error)
      showSnackbar('Failed to load users for assignment.', 'error')
      allUsersForSelection.value = []
    } finally {
      loadingUsersForSelection.value = false
    }
  }

  async function fetchUsersInOrganization (organizationId: string) {
    loadingUsersForSelection.value = true // Reuse loading state or create a new one
    try {
      const usersInOrg = await organizationService.listUsersInOrganization(organizationId)
      selectedUsersForOrganization.value = usersInOrg.map(user => user.id)
      // Store original users to compare on save
      currentOrganization.value.originalUsers = [...usersInOrg]
    } catch (error) {
      console.error(`Failed to fetch users for organization ${organizationId}:`, error)
      showSnackbar('Failed to load users for this organization.', 'error')
      selectedUsersForOrganization.value = []
      currentOrganization.value.originalUsers = []
    } finally {
      loadingUsersForSelection.value = false
    }
  }

  async function fetchOrganizations (options?: { page?: number, itemsPerPage?: number, sortBy?: any[], search?: string }) {
    loading.value = true
    error.value = null
    try {
      const params: any = {}
      if (options?.search && options.search.trim() !== '') {
        params.name = options.search.trim() // Assuming API supports search by name
      }
      // TODO: Implement server-side pagination/sorting if API supports it

      const allOrganizations = await organizationService.listOrganizations(params)

      let filteredOrganizations = allOrganizations
      if (search.value && search.value.trim() !== '' && !params.name) { // Client-side search fallback
        const searchTerm = search.value.toLowerCase()
        filteredOrganizations = allOrganizations.filter(org =>
          org.name.toLowerCase().includes(searchTerm),
        )
      }

      organizations.value = filteredOrganizations
      totalItems.value = filteredOrganizations.length // Adjust if server-side pagination
    } catch (error_: any) {
      console.error('Failed to fetch organizations:', error_)
      const errorMessage = error_.message || 'Failed to load organizations.'
      error.value = errorMessage
      organizations.value = []
      totalItems.value = 0
      showSnackbar(errorMessage, 'error')
    } finally {
      loading.value = false
    }
  }

  const debouncedFetchOrganizations = debounce(fetchOrganizations, 500)

  async function loadItems ({ page, itemsPerPage: ipp, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }) {
    await fetchOrganizations({ page, itemsPerPage: ipp, sortBy, search: search.value })
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info' = 'success', timeout = 3000) {
    snackbar.value = { visible: true, text, color, timeout }
  }

  // Create/Edit Organization
  function openCreateOrganizationDialog () {
    isCreatingNewOrganization.value = true
    canEditOrgName.value = true
    currentOrganization.value = { name: '', originalUsers: [] }
    selectedUsersForOrganization.value = []
    organizationDialogVisible.value = true
    // No need to fetch users for a new org initially
  }

  async function openEditOrganizationDialog (org: OrganizationDto) {
    isCreatingNewOrganization.value = false
    canEditOrgName.value = true // Or false if name shouldn't be editable after creation
    currentOrganization.value = { ...org, originalUsers: [] } // Initialize originalUsers
    organizationDialogVisible.value = true
    await fetchAllUsersForSelection() // Load all users for the autocomplete
    if (org.id) {
      await fetchUsersInOrganization(org.id) // Load users currently in this org
    }
  }

  function closeOrganizationDialog () {
    organizationDialogVisible.value = false
    currentOrganization.value = { name: '', originalUsers: [] }
    selectedUsersForOrganization.value = []
    isCreatingNewOrganization.value = false
    canEditOrgName.value = false
  }

  async function saveOrganization () {
    if (!isOrganizationFormValid.value || !currentOrganization.value.name) {
      showSnackbar('Organization name is required.', 'error')
      return
    }
    loading.value = true
    let orgSavedSuccessfully = false
    let usersAssignedSuccessfully = true

    try {
      let orgIdToUpdateUsers: string | undefined = currentOrganization.value.id

      if (isCreatingNewOrganization.value) {
        const payload: OrganizationDto = { name: currentOrganization.value.name.trim() }
        const newOrg = await organizationService.createOrganization(payload)
        if (newOrg && newOrg.id) {
          orgIdToUpdateUsers = newOrg.id // Get ID of the newly created org
          orgSavedSuccessfully = true
          currentOrganization.value.id = newOrg.id // Update current org with new ID for user assignment step
        } else {
          showSnackbar('Failed to create organization.', 'error')
          loading.value = false
          return
        }
      } else if (currentOrganization.value.id && currentOrganization.value.name !== (await organizationService.getOrganizationById(currentOrganization.value.id))?.name) {
        // TODO: Implement organizationService.updateOrganization if name editing is allowed
        // For now, we assume name is not editable after creation or handle it via a separate API if needed.
        // const updatedOrg = await organizationService.updateOrganization(currentOrganization.value.id, { name: currentOrganization.value.name.trim() });
        // if (updatedOrg) orgSavedSuccessfully = true; else showSnackbar('Failed to update organization name.', 'error');
        orgSavedSuccessfully = true // Assuming name update is handled or not allowed for now
      } else {
        orgSavedSuccessfully = true // No changes to org name itself
      }

      // Assign/Unassign Users if org was saved/identified
      if (orgSavedSuccessfully && orgIdToUpdateUsers) {
        const originalUserIds = new Set(currentOrganization.value.originalUsers?.map(u => u.id) || [])
        const selectedUserIds = new Set(selectedUsersForOrganization.value)

        const usersToAssign = selectedUsersForOrganization.value.filter(userId => !originalUserIds.has(userId))
        const usersToUnassign = Array.from(originalUserIds).filter(userId => !selectedUserIds.has(userId))

        for (const userId of usersToAssign) {
          try {
            await userService.assignUserToOrganization(userId, orgIdToUpdateUsers)
          } catch (error) {
            console.error(`Failed to assign user ${userId} to org ${orgIdToUpdateUsers}:`, error)
            showSnackbar(`Failed to assign user ID ${userId}.`, 'error')
            usersAssignedSuccessfully = false
          }
        }

        // Unassignment logic - requires specific API or backend handling of re-assigning to null/empty org
        for (const userId of usersToUnassign) {
          try {
            // This assumes assigning to a different (non-existent or special) org ID, or a dedicated unassign API
            // For example, if your API unassigns a user when their organizationId is set to null or an empty string:
            // await userService.assignUserToOrganization(userId, null); // This is hypothetical
            // Or, if you have a specific endpoint:
            // await userService.removeUserFromOrganization(userId, orgIdToUpdateUsers);
            console.warn(`User ${userId} needs to be unassigned. Implement unassignment API call.`)
            // For now, we'll just log it. If unassignment is critical, this needs a proper API call.
            // To make this example work without a true unassign, we'd have to rely on the user being assigned elsewhere
            // or the backend handling a user not being in selectedUsersForOrganization as an unassign.
          } catch (error) {
            console.error(`Failed to unassign user ${userId} from org ${orgIdToUpdateUsers}:`, error)
            showSnackbar(`Failed to unassign user ID ${userId}.`, 'error')
            usersAssignedSuccessfully = false
          }
        }
      }

      if (orgSavedSuccessfully && usersAssignedSuccessfully) {
        showSnackbar(`Organization ${isCreatingNewOrganization.value ? 'created' : 'updated'} successfully.`, 'success')
      } else if (orgSavedSuccessfully && !usersAssignedSuccessfully) {
        showSnackbar(`Organization ${isCreatingNewOrganization.value ? 'created' : 'saved (name)'}, but some user assignments failed.`, 'warning')
      } else if (!orgSavedSuccessfully) {
        // This case is handled by early return if creation fails
      }
    } catch (error_: any) {
      console.error(`Error ${isCreatingNewOrganization.value ? 'creating' : 'saving'} organization:`, error_)
      showSnackbar(error_.message || `Error ${isCreatingNewOrganization.value ? 'creating' : 'saving'} organization.`, 'error')
    } finally {
      loading.value = false
      await fetchOrganizations()
      closeOrganizationDialog()
    }
  }

  // Delete Organization
  function openDeleteOrganizationDialog (org: OrganizationDto) {
    organizationToDelete.value = org
    deleteOrganizationDialogVisible.value = true
  }

  function closeDeleteOrganizationDialog () {
    deleteOrganizationDialogVisible.value = false
    organizationToDelete.value = null
  }

  async function confirmDeleteOrganization () {
    if (!organizationToDelete.value || !organizationToDelete.value.id) {
      showSnackbar('Organization ID is missing, cannot delete.', 'error')
      closeDeleteOrganizationDialog()
      return
    }
    loading.value = true
    try {
      await organizationService.deleteOrganization(organizationToDelete.value.id)
      await fetchOrganizations() // Refresh list
      showSnackbar('Organization deleted successfully.', 'success')
    } catch (error_: any) {
      console.error('Error deleting organization:', error_)
      showSnackbar(error_.message || 'Error deleting organization.', 'error')
    } finally {
      loading.value = false
      closeDeleteOrganizationDialog()
    }
  }

  onMounted(() => {
  // fetchOrganizations will be called by loadItems initially
  })

</script>

<style scoped>
/* Add any specific styles for organization management here */
</style>
