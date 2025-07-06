import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = '/api/files'

export interface FileMetaResponseDto {
  id: string
  originalFileName: string
  fileSize: number
  uploadTime: string
  expiryTime: string
  maxDownloads: number
  downloadCount: number
  passwordProtected: boolean
  version: number
  uploaderUsername: string
  organizationId: string
  organizationName?: string
  fileType?: string
  mimeType?: string
}

export interface DownloadLogResponseDto {
  id: string
  downloadTime: string
  downloaderIp: string
  userAgent: string
  downloaderUserId: string
  downloaderUsername: string
  organizationId: string
}

export interface FileSharingActivityDto {
  fileInfo: FileMetaResponseDto
  downloads: DownloadLogResponseDto[]
}

export interface QrCodeBase64Response {
  fileId: string
  qrCodeBase64: string
}

export interface FilePermissionDto {
  id: string
  fileId: string
  username: string
  permissionLevel: string
  grantedAt: string
  grantedBy: string
}

export interface FileUploadResponseDto {
  message: string
  fileId: string
  downloadLink: string
  qrCodeBase64: string
}

// New interfaces for shared files
export interface SharedUserDto {
  username: string
  email: string
  shareDate: string
}

export interface SharedByMeItemDto {
  file: FileMetaResponseDto
  sharedWithUsers: SharedUserDto[]
}

export interface SharedWithMeItemDto {
  file: FileMetaResponseDto
  sharedBy: string
  shareDate: string
}

class FileService {
  async uploadFile (fileOrFormData: File | FormData, maxDownloads?: number, expiryMinutes?: number, password?: string, folderId?: string): Promise<FileUploadResponseDto> {
    let formData: FormData

    // If first parameter is already FormData, use it directly
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData
    } else {
      // Otherwise create FormData from individual parameters
      formData = new FormData()
      formData.append('file', fileOrFormData)
      formData.append('maxDownloads', maxDownloads?.toString() || '10')

      if (expiryMinutes) {
        formData.append('expiryMinutes', expiryMinutes.toString())
      }

      if (password) {
        formData.append('password', password)
      }

      if (folderId) {
        formData.append('folderId', folderId)
      }
    }

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getMyUploads (): Promise<FileMetaResponseDto[]> {
    const response = await axios.get<FileMetaResponseDto[]>(`${API_URL}/my-uploads`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  async getShareActivity (): Promise<FileSharingActivityDto[]> {
    const response = await axios.get<FileSharingActivityDto[]>(`${API_URL}/sharing-activity`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  // Delete file by ID
  async deleteFile (fileId: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/${fileId}`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  // Download file by ID
  async downloadFileById (fileId: string, password?: string): Promise<Blob> {
    const params: any = {}
    if (password) {
      params.password = password
    }
    const response = await axios.get(`${API_URL}/download/${fileId}`,
      {
        headers: this.getAuthHeaders(),
        params,
        responseType: 'blob',
      },
    )
    return response.data
  }

  // Download file by name
  async downloadFileByName (originalFileName: string, version?: string, password?: string): Promise<Blob> {
    const params: any = {}
    if (version) {
      params.version = version
    }
    if (password) {
      params.password = password
    }
    const response = await axios.get(`${API_URL}/downloadByName/${encodeURIComponent(originalFileName)}`,
      {
        headers: this.getAuthHeaders(),
        params,
        responseType: 'blob',
      },
    )
    return response.data
  }

  // Generate download token
  async generateDownloadToken (fileId: string, expiryMinutes = 5): Promise<string> {
    const response = await axios.get(`${API_URL}/generate-token/${fileId}`,
      {
        headers: this.getAuthHeaders(),
        params: { expiryMinutes },
      },
    )
    return response.data
  }

  // Secure download with token
  async secureDownload (token: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/secure-download`, {
      headers: this.getAuthHeaders(),
      params: { token },
      responseType: 'blob',
    })
    return response.data
  }

  // Download file (used by the Vue component)
  async downloadFile (fileId: string, password?: string): Promise<any> {
    return this.downloadFileById(fileId, password)
  }

  // Get file metadata with detailed information
  async getFileInfo (fileId: string): Promise<FileMetaResponseDto> {
    const response = await axios.get(`${API_URL}/meta/${fileId}`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  // User activity feed
  async getActivityFeed (): Promise<any[]> {
    const response = await axios.get(`${API_URL}/activity-feed`, {
      headers: this.getAuthHeaders(),
    })
    return response.data
  }

  // Admin audit trail - requires admin permissions
  async getAuditTrail (limit = 100): Promise<any[]> {
    const response = await axios.get(`${API_URL}/audit-trail`, {
      headers: this.getAuthHeaders(),
      params: { limit },
    })
    return response.data
  }

  // Filtered activity log
  async getActivityLog (params: {
    username?: string
    orgId?: string
    actionType?: string
    targetType?: string
    targetId?: string
    page?: number
    size?: number
  }): Promise<any> {
    const response = await axios.get(`${API_URL}/activity-log`, {
      headers: this.getAuthHeaders(),
      params,
    })
    return response.data
  }

  // Confirm delete file
  async confirmDeleteFile (fileId: string): Promise<{ message: string }> {
    return this.deleteFile(fileId)
  }

  // Download QR code for file
  async downloadQrCode (fileId: string): Promise<Blob> {
    const baseUrl = window.location.origin
    const response = await axios.get(`${API_URL}/download/qr/${fileId}`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob',
        params: { baseUrl },
      },
    )
    return response.data
  }

  // Get base64 QR code for a file
  async getBase64QrCode (fileId: string): Promise<QrCodeBase64Response> {
    const baseUrl = window.location.origin
    const response = await axios.get(`${API_URL}/download/qr/base64/${fileId}`, {
      headers: this.getAuthHeaders(),
      params: { baseUrl },
    })
    return response.data
  }

  // Get files shared by the current user
  async getFilesSharedByMe (): Promise<SharedByMeItemDto[]> {
    const response = await axios.get<SharedByMeItemDto[]>(`${API_URL}/shared-by-me`, {
      headers: this.getAuthHeaders(),
    })

    return response.data
  }

  // Get files shared with the current user
  async getFilesSharedWithMe (): Promise<SharedWithMeItemDto[]> {
    const response = await axios.get<SharedWithMeItemDto[]>(`${API_URL}/shared-with-me`, {
      headers: this.getAuthHeaders(),
    })

    return response.data
  }

  // Share file with users
  async shareFileWithUsers (fileId: string, emails: string[]): Promise<{ shared?: string[], alreadyShared?: string[], notFound?: string[] }> {
    const response = await axios.post(`${API_URL}/share`, emails, {
      headers: this.getAuthHeaders(),
      params: { fileId },
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

export default new FileService()
