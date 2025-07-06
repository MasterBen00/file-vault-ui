import axios from 'axios'

const API_URL = '/api' // Base API URL

interface LoginResponse {
  accessToken: string
  tokenType: string
}

class AuthService {
  async login (usernameOrEmail: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
      usernameOrEmail,
      password,
    })
    // Token storage will be handled by the auth store
    return response.data
  }

  async register (username: string, email: string, password: string, confirmPassword: string): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/auth/register`, {
      username,
      email,
      password,
      confirmPassword,
    })
    return response.data
  }

  async getMe (): Promise<UserInfoDto> {
    // Axios default headers should be set by the auth store when token changes
    const response = await axios.get<Omit<UserInfoDto, 'roles'> & { roles: string[] }>(`${API_URL}/user/me`)
    // Convert roles array to a Set to match UserInfoDto
    return {
      ...response.data,
      roles: new Set(response.data.roles || []), // Ensure roles is a Set, handle if roles is undefined/null
    }
  }

  async verifyEmail (token: string): Promise<string> {
    const response = await axios.get<string>(`${API_URL}/auth/verify-email`, { params: { token } })
    return response.data
  }
}

export default new AuthService()

export interface UserInfoDto {
  id: number
  username: string
  email: string
  roles: Set<string>
}
