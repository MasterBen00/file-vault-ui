<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col class="text-center" cols="12" lg="6" md="8">
        <div class="maintenance-wrapper">
          <v-icon class="mb-6" color="primary" size="100">mdi-wrench</v-icon>
          <h1 class="text-h2 font-weight-bold mb-4">We'll be back soon!</h1>
          <div class="text-body-1 mb-8">
            <p class="text-subtitle-1 mb-4">
              We're currently performing maintenance on our servers to bring you an even better experience.
            </p>
            <p>Our team is working hard to get everything back up and running as soon as possible.</p>
          </div>
          <v-card class="maintenance-status pa-4 mb-8" elevation="3">
            <div class="d-flex align-center">
              <v-progress-circular
                class="mr-3"
                color="primary"
                indeterminate
              />
              <div class="text-left">
                <div class="text-subtitle-2 font-weight-bold">System Status</div>
                <div class="text-caption">Scheduled Maintenance</div>
              </div>
              <v-spacer />
              <v-chip color="warning" size="small">In Progress</v-chip>
            </div>
          </v-card>
          <v-btn
            color="primary"
            :loading="checking"
            size="large"
            @click="checkStatus"
          >Check Status</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const checking = ref(false)

  const checkStatus = async () => {
    checking.value = true

    try {
      // Wait briefly to simulate checking the API
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Try navigating back to home page to check if service is back
      router.push('/')
    } catch (error) {
      console.error('Status check failed:', error)
    } finally {
      checking.value = false
    }
  }
</script>

<style scoped>
.maintenance-wrapper {
  animation: fadeIn 0.6s ease-in-out;
}

.maintenance-status {
  background-color: rgba(var(--v-theme-surface-variant), 0.8);
  border-left: 4px solid rgb(var(--v-theme-primary));
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
