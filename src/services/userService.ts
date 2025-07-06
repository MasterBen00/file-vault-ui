import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = '/api/user'

export interface UserStorageInfoDto {
  username: string
  maxStorageMb: number
  maxStorageBytes: number
  usageBytes: number
  usageMegaBytes: string
}

class UserService {
  // Get user storage information
  async getUserStorageInfo (): Promise<UserStorageInfoDto> {
    const response = await axios.get<UserStorageInfoDto>(`${API_URL}/storage-info`, {
      headers: this.getAuthHeaders(),
    })

    return response.data
  }

  private getAuthHeaders () {
    const authStore = useAuthStore()
    const token = authStore.token
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }
}

export default new UserService()
