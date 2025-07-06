import axios from 'axios'
import router from '@/router'

// Setup response interceptor for maintenance detection
axios.interceptors.response.use(
  response => {
    // Successful responses pass through normally
    return response
  },
  error => {
    // Check if the error is a 503 Service Unavailable
    if (error.response && error.response.status === 503) {
      console.log('Maintenance mode detected, redirecting to maintenance page')

      // Only redirect if we're not already on the maintenance page to avoid loops
      if (router.currentRoute.value.path !== '/maintenance') {
        router.push('/maintenance')
      }
    }

    // Return the error for other error handlers
    return Promise.reject(error)
  },
)

export default {}
