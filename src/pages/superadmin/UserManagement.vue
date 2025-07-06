<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pe-2">
        User Management
        <v-spacer />
        <!-- TODO: Add Create User Button and Dialog -->
      </v-card-title>

      <v-text-field
        v-model="search"
        class="pa-4"
        hide-details
        label="Search Users (Username, Email)"
        prepend-inner-icon="mdi-magnify"
        single-line
        variant="outlined"
        @input="debouncedFetchUsers"
      />

      <v-divider />

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        item-value="id"
        :items="users"
        :items-length="totalItems"
        :loading="loading"
        :search="search"
        @update:options="loadItems"
      >
        <template #item.roles="{ item }">
          {{ item.roles ? Array.from(item.roles).join(', ') : 'No Roles' }}
        </template>
        <template #item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'green' : 'red'" small :text="item.isActive ? 'Active' : 'Disabled'" />
        </template>
        <template #item.actions="{ item }">
          <v-icon class="me-2" small @click="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon
            class="me-2"
            :disabled="isUserProtected(item)"
            small
            @click="toggleUserStatusConfirmation(item)"
          >
            {{ item.isActive ? 'mdi-account-off' : 'mdi-account-check' }}
          </v-icon>
          <v-icon
            :disabled="isUserProtected(item)"
            small
            @click="openDeleteDialog(item)"
          >mdi-delete</v-icon>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Edit User Dialog -->
    <v-dialog v-model="editDialogVisible" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Edit User: {{ selectedUserForAction?.username }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editableUser.username" label="Username" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editableUser.email" label="Email" />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="selectedUserRoles"
                  chips
                  closable-chips
                  :disabled="loadingRoles || isUserProtected(selectedUserForAction)"
                  item-title="name"
                  item-value="name"
                  :items="allRoles"
                  label="Roles"
                  :loading="loadingRoles"
                  multiple
                >
                  <template #prepend-item>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title>
                          Assign Roles
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider class="mt-2" />
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="selectedUserOrganizationId"
                  clearable
                  :disabled="loadingOrganizations"
                  item-title="name"
                  item-value="id"
                  :items="allOrganizations"
                  label="Organization"
                  :loading="loadingOrganizations"
                >
                  <template #prepend-item>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title>
                          Assign Organization
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider class="mt-2" />
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeEditDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="saveUser">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="deleteDialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>Are you sure you want to delete user {{ selectedUserForAction?.username }}?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="confirmDeleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Toggle Status Dialog -->
    <v-dialog v-model="toggleStatusDialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Confirm Status Change</v-card-title>
        <v-card-text>
          Are you sure you want to {{ selectedUserForAction?.isActive ? 'disable' : 'enable' }} user {{ selectedUserForAction?.username }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeToggleStatusDialog">Cancel</v-btn>
          <v-btn :color="selectedUserForAction?.isActive ? 'red' : 'green'" text @click="confirmToggleUserStatus">
            {{ selectedUserForAction?.isActive ? 'Disable' : 'Enable' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup lang="ts">
  import type { OrganizationDto, RoleDto, UserInfoDto, UserUpdateDto } from '@/types/superAdmin'
  import { computed, onMounted, ref } from 'vue'
  import { organizationService, roleService, userService } from '@/services/superAdminService'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const currentUser = computed(() => authStore.currentUser)

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

  const users = ref<UserInfoDto[]>([])
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
    { title: 'Username', key: 'username' },
    { title: 'Email', key: 'email' },
    { title: 'Roles', key: 'roles', sortable: false },
    { title: 'Status', key: 'isActive' },
    { title: 'Organization', key: 'organizationName', sortable: false },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
  ])

  // Dialog states
  const editDialogVisible = ref(false)
  const deleteDialogVisible = ref(false)
  const toggleStatusDialogVisible = ref(false)

  const selectedUserForAction = ref<UserInfoDto | null>(null)
  const editableUser = ref<Partial<UserUpdateDto & { id: number | null }>>({ id: null, username: '', email: '' })
  const allRoles = ref<RoleDto[]>([])
  const selectedUserRoles = ref<string[]>([])
  const loadingRoles = ref(false)
  const allOrganizations = ref<OrganizationDto[]>([])
  const selectedUserOrganizationId = ref<string | null | undefined>(null)
  const loadingOrganizations = ref(false)

  function isUserProtected (user: UserInfoDto | null): boolean {
    if (!currentUser.value || !user) return false
    const isSelf = user.id === currentUser.value.id
    const isSuperAdmin = user.roles?.has('ROLE_SUPER_ADMIN')
    return isSelf || isSuperAdmin
  }

  async function fetchUsers (options?: { page?: number, itemsPerPage?: number, sortBy?: any[], search?: string }) {
    loading.value = true
    error.value = null
    try {
      const params: any = {}
      const allUsersFromApi = await userService.listUsers(params)

      const allUsersWithSetRoles: UserInfoDto[] = allUsersFromApi.map(userFromApi => ({
        ...userFromApi,
        roles: userFromApi.roles ? new Set(userFromApi.roles as unknown as string[]) : new Set<string>(),
      }))

      let filteredUsers = allUsersWithSetRoles
      if (search.value && search.value.trim() !== '') {
        const searchTerm = search.value.toLowerCase()
        filteredUsers = allUsersWithSetRoles.filter(user =>
          user.username.toLowerCase().includes(searchTerm)
          || user.email.toLowerCase().includes(searchTerm),
        )
      }

      users.value = filteredUsers
      totalItems.value = filteredUsers.length
    } catch (error_: any) {
      console.error('Failed to fetch users:', error_)
      error.value = error_.message || 'Failed to load users.'
      users.value = []
      totalItems.value = 0
      showSnackbar(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  const debouncedFetchUsers = debounce(fetchUsers, 500)

  async function loadItems ({ page, itemsPerPage: ipp, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }) {
    await fetchUsers({ page, itemsPerPage: ipp, sortBy, search: search.value })
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info' = 'success', timeout = 3000) {
    snackbar.value = { visible: true, text, color, timeout }
  }

  // Edit User
  async function openEditDialog (user: UserInfoDto) {
    selectedUserForAction.value = { ...user }
    editableUser.value = { id: user.id, username: user.username, email: user.email }
    selectedUserRoles.value = user.roles ? Array.from(user.roles) : []
    selectedUserOrganizationId.value = user.organizationId || null
    editDialogVisible.value = true
    await fetchAllRoles()
    await fetchAllOrganizations()
  }

  async function fetchAllRoles () {
    if (allRoles.value.length > 0 && !loadingRoles.value) return
    loadingRoles.value = true
    try {
      allRoles.value = await roleService.listRoles()
    } catch (error_) {
      console.error('Failed to fetch roles:', error_)
      showSnackbar('Failed to load available roles.', 'error')
      allRoles.value = []
    } finally {
      loadingRoles.value = false
    }
  }

  async function fetchAllOrganizations () {
    if (allOrganizations.value.length > 0 && !loadingOrganizations.value) return
    loadingOrganizations.value = true
    try {
      allOrganizations.value = await organizationService.listOrganizations()
    } catch (error_) {
      console.error('Failed to fetch organizations:', error_)
      showSnackbar('Failed to load available organizations.', 'error')
      allOrganizations.value = []
    } finally {
      loadingOrganizations.value = false
    }
  }

  function closeEditDialog () {
    editDialogVisible.value = false
    selectedUserForAction.value = null
    editableUser.value = { id: null, username: '', email: '' }
    selectedUserRoles.value = []
    selectedUserOrganizationId.value = null
  }

  async function saveUser () {
    if (!editableUser.value.id || !selectedUserForAction.value) {
      showSnackbar('No user selected for editing or ID missing.', 'error')
      return
    }
    loading.value = true
    let userUpdatedSuccessfully = false
    let rolesUpdatedSuccessfully = true
    let organizationUpdatedSuccessfully = true

    try {
      const updatePayload: UserUpdateDto = {}
      if (editableUser.value.username && editableUser.value.username !== selectedUserForAction.value.username) {
        updatePayload.username = editableUser.value.username
      }
      if (editableUser.value.email && editableUser.value.email !== selectedUserForAction.value.email) {
        updatePayload.email = editableUser.value.email
      }

      if (Object.keys(updatePayload).length > 0) {
        const updatedUser = await userService.updateUser(editableUser.value.id, updatePayload)
        if (updatedUser) {
          userUpdatedSuccessfully = true
        } else {
          showSnackbar('Failed to update user details.', 'error')
        }
      } else {
        userUpdatedSuccessfully = true
      }

      if (userUpdatedSuccessfully) {
        const originalRoles = selectedUserForAction.value.roles ? new Set(selectedUserForAction.value.roles) : new Set<string>()
        const newRoles = new Set(selectedUserRoles.value)

        const rolesToAdd = selectedUserRoles.value.filter(roleName => !originalRoles.has(roleName))
        const rolesToRemove = Array.from(originalRoles).filter(roleName => !newRoles.has(roleName))

        for (const roleName of rolesToAdd) {
          if (isUserProtected(selectedUserForAction.value) && roleName === 'ROLE_SUPER_ADMIN') {
            showSnackbar('Cannot assign ROLE_SUPER_ADMIN to this user.', 'error')
            rolesUpdatedSuccessfully = false
            continue
          }
          try {
            await userService.assignRoleToUser(editableUser.value.id, roleName)
          } catch (roleError) {
            console.error(`Failed to assign role ${roleName}:`, roleError)
            showSnackbar(`Failed to assign role: ${roleName}.`, 'error')
            rolesUpdatedSuccessfully = false
          }
        }

        for (const roleName of rolesToRemove) {
          if (isUserProtected(selectedUserForAction.value) && roleName === 'ROLE_SUPER_ADMIN') {
            showSnackbar('Cannot remove ROLE_SUPER_ADMIN from this user.', 'error')
            rolesUpdatedSuccessfully = false
            continue
          }
          try {
            await userService.removeRoleFromUser(editableUser.value.id, roleName)
          } catch (roleError) {
            console.error(`Failed to remove role ${roleName}:`, roleError)
            showSnackbar(`Failed to remove role: ${roleName}.`, 'error')
            rolesUpdatedSuccessfully = false
          }
        }
      }

      if (userUpdatedSuccessfully) {
        const originalOrganizationId = selectedUserForAction.value.organizationId
        const newOrganizationId = selectedUserOrganizationId.value

        if (newOrganizationId !== originalOrganizationId) {
          if (newOrganizationId) {
            try {
              await userService.assignUserToOrganization(editableUser.value.id, newOrganizationId)
            } catch (orgError) {
              console.error(`Failed to assign organization ${newOrganizationId}:`, orgError)
              showSnackbar(`Failed to assign organization.`, 'error')
              organizationUpdatedSuccessfully = false
            }
          } else {
            console.log('Organization cleared. Implement unassignment if API supports it.')
          }
        }
      }

      if (userUpdatedSuccessfully && rolesUpdatedSuccessfully && organizationUpdatedSuccessfully) {
        showSnackbar('User updated successfully.', 'success')
      } else {
        const messages = []
        if (!userUpdatedSuccessfully) messages.push('User detail update failed.')
        if (!rolesUpdatedSuccessfully) messages.push('Some role changes failed.')
        if (!organizationUpdatedSuccessfully) messages.push('Organization assignment failed.')
        showSnackbar(messages.join(' '), 'warning')
      }
    } catch (error_: any) {
      console.error('Error updating user:', error_)
      showSnackbar(error_.message || 'Error updating user.', 'error')
    } finally {
      loading.value = false
      await fetchUsers()
      closeEditDialog()
    }
  }

  // Toggle User Status
  function toggleUserStatusConfirmation (user: UserInfoDto) {
    if (isUserProtected(user)) {
      showSnackbar('This user cannot have their status changed.', 'error')
      return
    }
    selectedUserForAction.value = user
    toggleStatusDialogVisible.value = true
  }

  function closeToggleStatusDialog () {
    toggleStatusDialogVisible.value = false
    selectedUserForAction.value = null
  }

  async function confirmToggleUserStatus () {
    if (!selectedUserForAction.value) return
    if (isUserProtected(selectedUserForAction.value)) {
      showSnackbar('This user cannot have their status changed.', 'error')
      closeToggleStatusDialog()
      return
    }
    loading.value = true
    const userToToggle = selectedUserForAction.value
    try {
      let updatedUser: UserInfoDto | null = null
      updatedUser = await (userToToggle.isActive ? userService.disableUser(userToToggle.id) : userService.enableUser(userToToggle.id))
      if (updatedUser) {
        await fetchUsers()
        showSnackbar(`User ${userToToggle.isActive ? 'disabled' : 'enabled'} successfully.`, 'success')
      } else {
        showSnackbar(`Failed to ${userToToggle.isActive ? 'disable' : 'enable'} user.`, 'error')
      }
    } catch (error_: any) {
      console.error('Error toggling user status:', error_)
      showSnackbar(error_.message || 'Error toggling user status.', 'error')
    } finally {
      loading.value = false
      closeToggleStatusDialog()
    }
  }

  // Delete User
  function openDeleteDialog (user: UserInfoDto) {
    if (isUserProtected(user)) {
      showSnackbar('This user cannot be deleted.', 'error')
      return
    }
    selectedUserForAction.value = user
    deleteDialogVisible.value = true
  }

  function closeDeleteDialog () {
    deleteDialogVisible.value = false
    selectedUserForAction.value = null
  }

  async function confirmDeleteUser () {
    if (!selectedUserForAction.value) return
    if (isUserProtected(selectedUserForAction.value)) {
      showSnackbar('This user cannot be deleted.', 'error')
      closeDeleteDialog()
      return
    }
    loading.value = true
    try {
      await userService.deleteUser(selectedUserForAction.value.id)
      await fetchUsers()
      showSnackbar('User deleted successfully.', 'success')
    } catch (error_: any) {
      console.error('Error deleting user:', error_)
      showSnackbar(error_.message || 'Error deleting user.', 'error')
    } finally {
      loading.value = false
      closeDeleteDialog()
    }
  }

  onMounted(() => {})
</script>

<style scoped>
/* Add any specific styles for user management here */
</style>
