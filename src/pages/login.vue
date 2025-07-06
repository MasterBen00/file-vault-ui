<template>
  <v-container class="login-page-background fill-height pa-0" fluid>
    <v-row align="center" class="fill-height" justify="center">
      <v-col cols="12" lg="4" md="5" sm="8">
        <v-card class="elevation-12 pa-6 rounded-lg">
          <v-card-title class="text-center text-h5 font-weight-bold mb-4">
            <v-icon class="mr-2" color="primary" large left>mdi-login-variant</v-icon>
            Welcome Back!
          </v-card-title>
          <v-card-subtitle class="text-center mb-6">
            Sign in to continue to FileSharer
          </v-card-subtitle>
          <v-sheet class="pa-4" color="transparent" rounded="lg">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="usernameOrEmail"
                class="mb-3"
                :error-messages="errors.usernameOrEmail"
                label="Username or Email"
                name="usernameOrEmail"
                prepend-inner-icon="mdi-account-outline"
                required
                type="text"
                variant="outlined"
              />
              <v-text-field
                v-model="password"
                class="mb-3"
                :error-messages="errors.password"
                label="Password"
                name="password"
                prepend-inner-icon="mdi-lock-outline"
                required
                type="password"
                variant="outlined"
              />

              <div class="d-flex align-center mb-2">
                <v-checkbox
                  v-model="rememberMe"
                  class="ma-0 pa-0"
                  color="primary"
                  hide-details
                  label="Remember me"
                />
              </div>

              <v-alert
                v-if="errors.api"
                class="mb-4"
                dense
                type="error"
                variant="tonal"
              >
                {{ errors.api }}
              </v-alert>
              <v-btn
                block
                class="mt-4"
                color="primary"
                :loading="loading"
                rounded="lg"
                size="large"
                type="submit"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-sheet>
          <v-card-actions class="justify-center mt-4">
            <span class="text-body-2">Don't have an account?</span>
            <v-btn
              class="pl-1"
              color="primary"
              density="compact"
              text
              to="/register"
            >
              Register here
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()

  const usernameOrEmail = ref('')
  const password = ref('')
  const loading = ref(false)
  const errors = ref<Record<string, string>>({})
  const rememberMe = ref(false)

  // Load saved credentials if they exist
  onMounted(() => {
    const savedUsername = localStorage.getItem('remembered_username')
    if (savedUsername) {
      usernameOrEmail.value = savedUsername
      rememberMe.value = true
    }
  })

  const handleLogin = async () => {
    loading.value = true
    errors.value = {}
    try {
      // Save or remove credentials based on remember me checkbox
      if (rememberMe.value) {
        localStorage.setItem('remembered_username', usernameOrEmail.value)
      } else {
        localStorage.removeItem('remembered_username')
      }

      await authStore.login(usernameOrEmail.value, password.value, rememberMe.value)
    } catch (error: any) {
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errors.value.api = error.response.data
        } else if (error.response.data.message) {
          errors.value.api = error.response.data.message
        } else {
          errors.value.api = 'Login failed. Please check your credentials.'
        }
      } else {
        errors.value.api = 'An unexpected error occurred.'
      }
      console.error('Login error:', error)
    }
    loading.value = false
  }
</script>

<style scoped>
.login-page-background {
  /* Light mode gradient by default */
  background: linear-gradient(135deg, #f0f2f5 0%, #d6dbdf 100%);
}

@media (prefers-color-scheme: dark) {
  .login-page-background {
    /* Dark mode gradient */
    background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  }
}
</style>
