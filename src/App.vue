<template>
  <Editor/>
</template>

<script>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import Editor from './components/Editor.vue'
export default{
  data(){
    return {
      sourceCode: '',
    };
  },
  components: {
    Editor
  }
}
</script>

<style>

</style>
