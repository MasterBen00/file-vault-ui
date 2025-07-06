<template>
  <v-container class="d-flex flex-column align-center justify-center" style="min-height: 80vh;">
    <v-row class="text-center">
      <v-col cols="12">
        <h1 class="text-h1 font-weight-bold primary--text mb-4">404</h1>
        <h2 class="text-h4 mb-6">Page Not Found</h2>
        <p class="text-body-1 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div>
          <v-btn
            class="mr-4"
            color="primary"
            to="/"
          >
            Back to Home
          </v-btn>

          <v-btn
            color="secondary"
            variant="outlined"
            @click="$router.go(-1)"
          >
            Go Back
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Uncomment and update path if you have a 404 illustration -->
    <!--
    <v-img
      alt="Page not found"
      class="mt-8"
      max-width="400"
      src="@/assets/404-illustration.svg"
    ></v-img>
    -->
  </v-container>
</template>

<script setup>
// Set page title
  document.title = '404 - Page Not Found'
</script>

<style scoped>
/* You can add custom styles for the 404 page here */
</style>
