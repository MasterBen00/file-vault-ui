import type { FileMetaResponseDto } from './fileService'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = '/api/folders'

export interface FolderDto {
  id: string
  name: string
  parentId: string | null
  ownerUsername: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface FolderContentsDto {
  folders: FolderDto[]
  files: FileMetaResponseDto[]
}

class FolderService {
  // Create a new folder
  async createFolder (name: string, parentId?: string): Promise<FolderDto> {
    const response = await axios.post(
      `${API_URL}`,
      { name, parentId },
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  // Get folder contents (files and subfolders)
  async getFolderContents (parentId?: string): Promise<FolderContentsDto> {
    const params: any = {}
    if (parentId) {
      params.parentId = parentId
    }

    const response = await axios.get(`${API_URL}/contents`, {
      headers: this.getAuthHeaders(),
      params,
    })

    return response.data
  }

  // Get root folder contents
  async getRootFolderContents (): Promise<FolderContentsDto> {
    return this.getFolderContents()
  }

  // Get all available folders for the current user
  async getAvailableFolders (): Promise<FolderDto[]> {
    const response = await axios.get(`${API_URL}/available`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  // Get folder path (breadcrumbs)
  async getFolderPath (folderId: string): Promise<FolderDto[]> {
    const response = await axios.get(`${API_URL}/${folderId}/path`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  // Update folder name
  async updateFolder (folderId: string, name: string): Promise<FolderDto> {
    const response = await axios.put(
      `${API_URL}/${folderId}`,
      { name },
      { headers: this.getAuthHeaders() },
    )
    return response.data
  }

  // Delete folder
  async deleteFolder (folderId: string): Promise<void> {
    await axios.delete(`${API_URL}/${folderId}`, {
      headers: this.getAuthHeaders(),
    })
  }

  // Move a folder
  async moveFolder (folderId: string, parentId: string | null): Promise<FolderDto> {
    const response = await axios.post(
      `${API_URL}/${folderId}/move`,
      { parentId },
      { headers: this.getAuthHeaders() },
    )

    return response.data
  }

  // Rename a folder
  async renameFolder (folderId: string, name: string): Promise<FolderDto> {
    return this.updateFolder(folderId, name)
  }

  // Helper method to get authentication headers
  private getAuthHeaders () {
    const authStore = useAuthStore()
    const token = authStore.token
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }
}

export default new FolderService()
