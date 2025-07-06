// Need to import axios to set default headers
import axios from 'axios' // Import router for navigation
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import router from '@/router'

import authService, { type UserInfoDto } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('user_token'))
  const currentUser = ref<UserInfoDto | null>(null)
  const tokenExpiration = ref<number | null>(Number(localStorage.getItem('token_expiration')) || null)

  // Function to initialize axios default headers based on current token.value
  function initializeAuthHeader () {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      console.log('[AuthStore] Axios default Authorization header set on init.')
    } else {
      delete axios.defaults.headers.common['Authorization']
      console.log('[AuthStore] No token on init, Axios default Authorization header cleared.')
    }
  }

  const isAuthenticated = computed(() => !!token.value)
  const username = computed(() => currentUser.value?.username || currentUser.value?.email || 'User')

  function setToken (newToken: string | null, rememberMe = false) {
    token.value = newToken

    if (newToken) {
      // For "Remember Me", store in localStorage for persistence across sessions
      // For non-Remember Me, store in sessionStorage which is cleared when browser is closed
      if (rememberMe) {
        localStorage.setItem('user_token', newToken)
        // Set token expiration - 30 days for "Remember Me"
        const expirationTime = Date.now() + 30 * 24 * 60 * 60 * 1000
        localStorage.setItem('token_expiration', expirationTime.toString())
        tokenExpiration.value = expirationTime
      } else {
        sessionStorage.setItem('user_token', newToken)
        // Set short expiration for session-only - 1 day
        const expirationTime = Date.now() + 24 * 60 * 60 * 1000
        sessionStorage.setItem('token_expiration', expirationTime.toString())
        tokenExpiration.value = expirationTime
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      console.log('[AuthStore] Token set and Axios header updated.')
    } else {
      localStorage.removeItem('user_token')
      localStorage.removeItem('token_expiration')
      sessionStorage.removeItem('user_token')
      sessionStorage.removeItem('token_expiration')
      tokenExpiration.value = null
      delete axios.defaults.headers.common['Authorization']
      console.log('[AuthStore] Token removed and Axios header cleared.')
    }
  }

  async function login (usernameOrEmail: string, password: string, rememberMe = false) {
    try {
      const loginData = await authService.login(usernameOrEmail, password) // authService.login will now just return data
      setToken(loginData.accessToken, rememberMe)
      await fetchUser()
      router.push('/') // Redirect to root URL instead of /dashboard
    } catch (error) {
      console.error('Login failed in store:', error)
      throw error // Re-throw to be caught in the component
    }
  }

  async function register (usernameVal: string, emailVal: string, passwordVal: string, confirmPasswordVal: string) { // Add confirmPasswordVal
    // Pass confirmPasswordVal to authService.register
    const message = await authService.register(usernameVal, emailVal, passwordVal, confirmPasswordVal)
    // Optionally auto-login or redirect here if desired
    return message
  }

  async function fetchUser () {
    if (token.value && !currentUser.value) { // Fetch only if token exists and user not already fetched
      try {
        const user = await authService.getMe() // authService.getMe uses its own getAuthHeader
        currentUser.value = user
      } catch (error) {
        console.error('Failed to fetch user:', error)
        // If fetchUser fails (e.g. token invalid), clear token and user
        // This can happen if a stored token is no longer valid
        setToken(null) // This will also clear currentUser via watcher or direct set
        currentUser.value = null
        // Optionally redirect to login
        // router.push('/login');
      }
    } else if (!token.value) {
      currentUser.value = null // Clear user if no token
    }
  }

  function logout () {
    setToken(null)
    currentUser.value = null
    router.push('/login')
  }

  // Check token expiration on init
  function checkTokenExpiration () {
    if (tokenExpiration.value && Date.now() > tokenExpiration.value) {
      console.log('[AuthStore] Token expired, logging out')
      logout()
      return false
    }
    return true
  }

  async function verifyEmail (token: string) { // Add this function
    try {
      const response = await authService.verifyEmail(token)
      return response // Assuming authService.verifyEmail returns a success message string
    } catch (error) {
      console.error('Email verification failed in store:', error)
      throw error // Re-throw to be caught in the component
    }
  }

  // Attempt to fetch user if token exists on store initialization (e.g., page refresh)
  // Initialize header first, then try to fetch user
  initializeAuthHeader() // Call this before fetchUser on init

  // First check if token is expired
  if (token.value && checkTokenExpiration()) {
    console.log('[AuthStore] Token exists and is valid on init, proceeding to fetchUser.')
    fetchUser()
  } else if (!token.value) {
    console.log('[AuthStore] No token found on init.')
  }

  return {
    token,
    currentUser,
    isAuthenticated,
    username,
    login,
    register,
    logout,
    fetchUser,
    verifyEmail,
  }
})
