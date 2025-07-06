<template>
  <v-container class="profile-page-container fill-height pa-0" fluid>
    <v-row align="center" class="fill-height" justify="center">
      <v-col cols="12" lg="6" md="8">
        <v-card class="elevation-12 pa-6 rounded-lg">
          <v-card-title class="text-h5 font-weight-bold mb-6 d-flex align-center">
            <v-icon class="mr-3" color="primary" large>mdi-account-circle-outline</v-icon>
            User Profile
          </v-card-title>

          <v-skeleton-loader
            v-if="loading && !authStore.currentUser"
            type="article, actions"
          />

          <v-card-text v-if="!loading && authStore.currentUser">
            <v-list lines="two">
              <v-list-item class="mb-2">
                <template #prepend>
                  <v-icon color="primary">mdi-identifier</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">User ID</v-list-item-title>
                <v-list-item-subtitle>{{ authStore.currentUser.id }}</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2" inset />

              <v-list-item class="mb-2">
                <template #prepend>
                  <v-icon color="primary">mdi-account-outline</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">Username</v-list-item-title>
                <v-list-item-subtitle>{{ authStore.currentUser.username }}</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2" inset />

              <v-list-item class="mb-2">
                <template #prepend>
                  <v-icon color="primary">mdi-email-outline</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">Email</v-list-item-title>
                <v-list-item-subtitle>{{ authStore.currentUser.email }}</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2" inset />

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-shield-account-outline</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">Roles</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    v-for="role in authStore.currentUser.roles"
                    :key="role"
                    class="mr-2 mt-1"
                    color="primary"
                    label
                    small
                  >
                    {{ role }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-2" inset />

              <!-- Storage usage section -->
              <v-list-item class="mb-2">
                <template #prepend>
                  <v-icon color="primary">mdi-database</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold">Storage Usage</v-list-item-title>
                <v-list-item-subtitle>
                  <div v-if="storageInfo">
                    <div class="d-flex justify-space-between align-center mt-2 mb-1">
                      <span>{{ storageInfo.usageMegaBytes }} MB / {{ storageInfo.maxStorageMb }} MB</span>
                      <span>{{ Math.round((storageInfo.usageBytes / storageInfo.maxStorageBytes) * 100) }}%</span>
                    </div>
                    <v-progress-linear
                      :color="getStorageColor(storageInfo.usageBytes, storageInfo.maxStorageBytes)"
                      height="10"
                      :model-value="(storageInfo.usageBytes / storageInfo.maxStorageBytes) * 100"
                      rounded
                    />
                  </div>
                  <v-skeleton-loader v-else type="text" />
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-text v-if="!loading && !authStore.currentUser">
            <v-alert type="warning" variant="tonal">
              Could not load user profile information.
            </v-alert>
          </v-card-text>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import type { UserStorageInfoDto } from '@/services/userService'
  import { onMounted, ref } from 'vue'
  import userService from '@/services/userService'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const loading = ref(true)
  const storageInfo = ref<UserStorageInfoDto | null>(null)

  // Function to determine the color of the progress bar based on usage
  const getStorageColor = (usedBytes: number, maxBytes: number): string => {
    const usagePercentage = (usedBytes / maxBytes) * 100
    if (usagePercentage < 70) return 'success'
    if (usagePercentage < 90) return 'warning'
    return 'error'
  }

  // Fetch user storage info
  const fetchStorageInfo = async () => {
    try {
      storageInfo.value = await userService.getUserStorageInfo()
    } catch (error) {
      console.error('Error fetching storage information:', error)
    }
  }

  onMounted(async () => {
    if (!authStore.currentUser && authStore.token) {
      // Attempt to fetch user if not already loaded (e.g., direct navigation or refresh)
      try {
        await authStore.fetchUser()
      } catch (error) {
        console.error('Error fetching user on profile page mount:', error)
      }
    }

    // Fetch storage information
    await fetchStorageInfo()

    loading.value = false
  })

</script>

<style scoped>
.profile-page-container {
  /* Light mode gradient by default */
  background: linear-gradient(135deg, #f0f2f5 0%, #d6dbdf 100%);
}

@media (prefers-color-scheme: dark) {
  .profile-page-container {
    /* Dark mode gradient */
    background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  }
}

.v-list-item-title {
  font-size: 1rem;
}
.v-list-item-subtitle {
  font-size: 0.9rem;
  color: #555; /* Default for light mode */
}

@media (prefers-color-scheme: dark) {
  .v-list-item-subtitle {
    color: #bbb; /* Lighter for dark mode */
  }
}
</style>
