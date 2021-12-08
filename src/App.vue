<template>
  <Editor ref="editor"/>
</template>

<script>
import Editor from './components/Editor.vue'
export default{
  data(){
    return {
      sourceCode: '',
      version: "14"
    };
  },
  components: {
    Editor
  }
}
</script>

<style>

</style>
