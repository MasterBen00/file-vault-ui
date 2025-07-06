<template>
  <v-container class="register-page-background fill-height pa-0" fluid>
    <v-row align="center" class="fill-height" justify="center">
      <v-col cols="12" lg="4" md="5" sm="8">
        <v-card class="elevation-12 pa-6 rounded-lg">
          <v-card-title class="text-center text-h5 font-weight-bold mb-4">
            <v-icon class="mr-2" color="primary" large left>mdi-account-plus-outline</v-icon>
            Create Your Account
          </v-card-title>
          <v-card-subtitle class="text-center mb-6">
            Join FileSharer today!
          </v-card-subtitle>
          <v-sheet class="pa-4" color="transparent" rounded="lg">
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="username"
                class="mb-3"
                :error-messages="errors.username"
                label="Username"
                name="username"
                prepend-inner-icon="mdi-account-circle-outline"
                required
                type="text"
                variant="outlined"
              />
              <v-text-field
                v-model="email"
                class="mb-3"
                :error-messages="errors.email"
                label="Email Address"
                name="email"
                prepend-inner-icon="mdi-email-outline"
                required
                type="email"
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
              <v-text-field
                v-model="confirmPassword"
                class="mb-3"
                :error-messages="errors.confirmPassword || passwordMismatchError"
                label="Confirm Password"
                name="confirmPassword"
                prepend-inner-icon="mdi-lock-check-outline"
                required
                type="password"
                variant="outlined"
              />
              <v-alert
                v-if="successMessage"
                class="mb-4"
                dense
                type="success"
                variant="tonal"
              >
                {{ successMessage }}
              </v-alert>
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
                Register
              </v-btn>
            </v-form>
          </v-sheet>
          <v-card-actions class="justify-center mt-4">
            <span class="text-body-2">Already have an account?</span>
            <v-btn
              class="pl-1"
              color="primary"
              density="compact"
              text
              to="/login"
            >
              Sign In
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router/auto'
  import { useAuthStore } from '@/stores/authStore'

  const router = useRouter()
  const authStore = useAuthStore()

  const username = ref('')
  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const loading = ref(false)
  const errors = ref<Record<string, string>>({})
  const successMessage = ref('')

  const passwordMismatchError = computed(() => {
    if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      return 'Passwords do not match.'
    }
    return ''
  })

  const handleRegister = async () => {
    errors.value = {}

    if (password.value !== confirmPassword.value) {
      errors.value.confirmPassword = 'Passwords do not match.'
      loading.value = false
      return
    }

    loading.value = true
    successMessage.value = ''
    try {
      const message = await authStore.register(username.value, email.value, password.value, confirmPassword.value)
      successMessage.value = message || 'Registration successful! Redirecting to login...'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errors.value.api = error.response.data
        } else if (error.response.data.message) {
          errors.value.api = error.response.data.message
        } else if (error.response.data.errors) {
          for (const key in error.response.data.errors) {
            errors.value[key.toLowerCase()] = error.response.data.errors[key].join(', ')
          }
          errors.value.api = !errors.value.api && Object.keys(errors.value).length > 0 ? 'Please correct the errors above.' : 'Registration failed. Please check your input.'
        } else {
          errors.value.api = 'Registration failed. Please try again.'
        }
      } else {
        errors.value.api = 'An unexpected error occurred.'
      }
      console.error('Registration error:', error)
    }
    loading.value = false
  }
</script>

<style scoped>
.register-page-background {
  background: linear-gradient(135deg, #e9edf1 0%, #ced4da 100%);
}

@media (prefers-color-scheme: dark) {
  .register-page-background {
    background: linear-gradient(135deg, #34495e 0%, #202d39 100%);
  }
}
</style>
