<template>
  <div :style="{flex: width, display: 'flex', flexDirection: 'column'}">
    <app-preview/>
  </div>
</template>

<script>
import AppPreview from './AppPreview.vue'
  export default {
    components: { AppPreview },
    props: {
      width: {
        type: Number,
        default: 5
      }
    }
  }
</script>