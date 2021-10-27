<template>
  <div style="overflow: auto" class="outline">
    Outline
    <p v-for="i in 20" :key="i">{{i}}</p>
  </div>
</template>

<script>
  export default {

  }
</script>