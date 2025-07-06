import type {
  AdminAuditLogDto,
  BulkUserIdsDto,
  BulkUserOrganizationDto,
  BulkUserRoleDto,
  OrganizationDto,
  RoleDto,
  SystemSettingDto,
  UserInfoDto,
  UserPasswordResetDto,
  UserUpdateDto,
} from '@/types/superAdmin'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore' // Import authStore

// TODO: Move to a configuration file or environment variable
const API_BASE_URL = '/api/superadmin' // Changed to relative path

const superAdminApiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Add a request interceptor to include the auth token
superAdminApiClient.interceptors.request.use(config => {
  const authStore = useAuthStore()
  const token = authStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

// Generic error handler
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error.response?.data || error.message)
  throw error.response?.data || new Error(`An error occurred during ${context}.`)
}

// 1. User Management
export const userService = {
  listUsers: async (params?: { username?: string, email?: string, organizationId?: string, roleName?: string, isActive?: boolean }): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.get<UserInfoDto[]>('/users', { params })
      return response.data
    } catch (error) {
      handleError(error, 'listing users')
      return [] // Should be caught by handleError, but as a fallback
    }
  },
  getUserById: async (userId: number): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.get<UserInfoDto>(`/users/${userId}`)
      return response.data
    } catch (error) {
      handleError(error, `getting user ${userId}`)
      return null
    }
  },
  updateUser: async (userId: number, payload: UserUpdateDto): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}`, payload)
      return response.data
    } catch (error) {
      handleError(error, `updating user ${userId}`)
      return null
    }
  },
  deleteUser: async (userId: number): Promise<void> => {
    try {
      await superAdminApiClient.delete(`/users/${userId}`)
    } catch (error) {
      handleError(error, `deleting user ${userId}`)
    }
  },
  enableUser: async (userId: number): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}/enable`)
      return response.data
    } catch (error) {
      handleError(error, `enabling user ${userId}`)
      return null
    }
  },
  disableUser: async (userId: number): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}/disable`)
      return response.data
    } catch (error) {
      handleError(error, `disabling user ${userId}`)
      return null
    }
  },
  forceLogoutUser: async (userId: number): Promise<void> => {
    try {
      await superAdminApiClient.post(`/users/${userId}/force-logout`)
    } catch (error) {
      handleError(error, `forcing logout for user ${userId}`)
    }
  },
  resetUserPassword: async (userId: number, payload: UserPasswordResetDto): Promise<void> => {
    try {
      await superAdminApiClient.post(`/users/${userId}/reset-password`, payload)
    } catch (error) {
      handleError(error, `resetting password for user ${userId}`)
    }
  },
  assignUserToOrganization: async (userId: number, organizationId: string): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}/assign-organization/${organizationId}`)
      return response.data
    } catch (error) {
      handleError(error, `assigning user ${userId} to organization ${organizationId}`)
      return null
    }
  },
  assignRoleToUser: async (userId: number, roleName: string): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}/assign-role/${roleName}`)
      return response.data
    } catch (error) {
      handleError(error, `assigning role ${roleName} to user ${userId}`)
      return null
    }
  },
  removeRoleFromUser: async (userId: number, roleName: string): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}/remove-role/${roleName}`)
      return response.data
    } catch (error) {
      handleError(error, `removing role ${roleName} from user ${userId}`)
      return null
    }
  },
  makeUserAdmin: async (userId: number): Promise<UserInfoDto | null> => {
    try {
      const response = await superAdminApiClient.put<UserInfoDto>(`/users/${userId}/make-admin`)
      return response.data
    } catch (error) {
      handleError(error, `making user ${userId} admin`)
      return null
    }
  },
}

// 2. Bulk User Operations
export const bulkUserService = {
  bulkAssignOrganization: async (payload: BulkUserOrganizationDto): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.post<UserInfoDto[]>('/users/bulk-assign-organization', payload)
      return response.data
    } catch (error) {
      handleError(error, 'bulk assigning organization')
      return []
    }
  },
  bulkAssignRole: async (payload: BulkUserRoleDto): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.post<UserInfoDto[]>('/users/bulk-assign-role', payload)
      return response.data
    } catch (error) {
      handleError(error, 'bulk assigning role')
      return []
    }
  },
  bulkRemoveRole: async (payload: BulkUserRoleDto): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.post<UserInfoDto[]>('/users/bulk-remove-role', payload)
      return response.data
    } catch (error) {
      handleError(error, 'bulk removing role')
      return []
    }
  },
  bulkEnableUsers: async (payload: BulkUserIdsDto): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.post<UserInfoDto[]>('/users/bulk-enable', payload)
      return response.data
    } catch (error) {
      handleError(error, 'bulk enabling users')
      return []
    }
  },
  bulkDisableUsers: async (payload: BulkUserIdsDto): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.post<UserInfoDto[]>('/users/bulk-disable', payload)
      return response.data
    } catch (error) {
      handleError(error, 'bulk disabling users')
      return []
    }
  },
  bulkDeleteUsers: async (payload: BulkUserIdsDto): Promise<void> => {
    try {
      await superAdminApiClient.post('/users/bulk-delete', payload)
    } catch (error) {
      handleError(error, 'bulk deleting users')
    }
  },
}

// 3. Role Management
export const roleService = {
  createRole: async (payload: RoleDto): Promise<RoleDto | null> => {
    try {
      const response = await superAdminApiClient.post<RoleDto>('/roles', payload)
      return response.data
    } catch (error) {
      handleError(error, 'creating role')
      return null
    }
  },
  listRoles: async (params?: { name?: string }): Promise<RoleDto[]> => {
    try {
      const response = await superAdminApiClient.get<RoleDto[]>('/roles', { params })
      return response.data
    } catch (error) {
      handleError(error, 'listing roles')
      return []
    }
  },
  deleteRole: async (roleName: string): Promise<void> => {
    try {
      await superAdminApiClient.delete(`/roles/${roleName}`)
    } catch (error) {
      handleError(error, `deleting role ${roleName}`)
    }
  },
}

// 4. Organization Management
export const organizationService = {
  createOrganization: async (payload: OrganizationDto): Promise<OrganizationDto | null> => {
    try {
      const response = await superAdminApiClient.post<OrganizationDto>('/organizations', payload)
      return response.data
    } catch (error) {
      handleError(error, 'creating organization')
      return null
    }
  },
  listOrganizations: async (params?: { name?: string }): Promise<OrganizationDto[]> => {
    try {
      const response = await superAdminApiClient.get<OrganizationDto[]>('/organizations', { params })
      return response.data
    } catch (error) {
      handleError(error, 'listing organizations')
      return []
    }
  },
  getOrganizationById: async (organizationId: string): Promise<OrganizationDto | null> => {
    try {
      const response = await superAdminApiClient.get<OrganizationDto>(`/organizations/${organizationId}`)
      return response.data
    } catch (error) {
      handleError(error, `getting organization ${organizationId}`)
      return null
    }
  },
  deleteOrganization: async (organizationId: string): Promise<void> => {
    try {
      await superAdminApiClient.delete(`/organizations/${organizationId}`)
    } catch (error) {
      handleError(error, `deleting organization ${organizationId}`)
    }
  },
  listUsersInOrganization: async (organizationId: string): Promise<UserInfoDto[]> => {
    try {
      const response = await superAdminApiClient.get<UserInfoDto[]>(`/organizations/${organizationId}/users`)
      return response.data
    } catch (error) {
      handleError(error, `listing users in organization ${organizationId}`)
      return []
    }
  },
}

// 5. Admin Audit Log Viewer
export const auditLogService = {
  listAuditLogs: async (params?: {
    adminUsername?: string
    actionType?: string
    targetEntityType?: string
    targetEntityId?: string
    startDate?: string // ISO DateTime String
    endDate?: string // ISO DateTime String
  }): Promise<AdminAuditLogDto[]> => {
    try {
      const response = await superAdminApiClient.get<AdminAuditLogDto[]>('/audit-logs', { params })
      return response.data
    } catch (error) {
      handleError(error, 'listing audit logs')
      return []
    }
  },
}

// 6. System Settings Management
export const systemSettingsService = {
  listSystemSettings: async (): Promise<SystemSettingDto[]> => {
    try {
      const response = await superAdminApiClient.get<SystemSettingDto[]>('/settings')
      return response.data
    } catch (error) {
      handleError(error, 'listing system settings')
      return []
    }
  },
  getSystemSettingByKey: async (key: string): Promise<SystemSettingDto | null> => {
    try {
      const response = await superAdminApiClient.get<SystemSettingDto>(`/settings/${key}`)
      return response.data
    } catch (error) {
      handleError(error, `getting system setting ${key}`)
      return null
    }
  },
  updateSystemSetting: async (payload: SystemSettingDto): Promise<SystemSettingDto | null> => {
    try {
      const response = await superAdminApiClient.put<SystemSettingDto>('/settings', payload)
      return response.data
    } catch (error) {
      handleError(error, 'updating system setting')
      return null
    }
  },
}
