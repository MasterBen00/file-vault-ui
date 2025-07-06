<template>
  <v-footer
    app
    height="40"
  >
    <v-spacer />
    <div
      class="text-caption text-disabled"
    >
      &copy; {{ (new Date()).getFullYear() }} FileSharer - All Rights Reserved
    </div>
    <v-spacer />
  </v-footer>
</template>

<script setup lang="ts">
  // No script needed for this simple footer
</script>

<style scoped lang="sass">
  // Add any specific footer styles if needed
</style>
