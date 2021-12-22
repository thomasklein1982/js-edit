<template>
  <Editor :current-pos="currentPos" :paused="paused" :breakpoints="breakpoints" ref="editor"/>
</template>

<script>
import Editor from './components/Editor.vue'
export default{
  data(){
    return {
      sourceCode: '',
      sourceCodeDebugging: '',
      version: "16",
      breakpoints: {},
      paused: false,
      currentPos: -1
    };
  },
  methods: {
    toggleBreakpoint(pos,isOn){
      if(this.breakpoints[pos]){
        delete this.breakpoints[pos];
      }else{
        this.breakpoints[pos]=true;
      }
    }
  },
  components: {
    Editor
  }
}
</script>

<style>

</style>
