<template>
  <Toast />
  <Editor :current-pos="currentPos" :paused="paused" :breakpoints="breakpoints" ref="editor"/>
</template>

<script>
import Editor from './components/Editor.vue'
import {useToast} from 'primevue/usetoast'
let toast;
export default{
  data(){
    return {
      sourceCode: '',
      sourceCodeDebugging: '',
      version: "27",
      breakpoints: {},
      paused: false,
      currentPos: -1
    };
  },
  setup(){
    toast=useToast();
  },
  methods: {
    setBreakpoint(pos,isOn){
      if(!isOn){
        delete this.breakpoints[pos];
      }else{
        this.breakpoints[pos]=true;
      }
      console.log(pos,isOn,this.breakpoints);
    },
    toast(object){
      toast.add(object);//{severity:'info', summary: 'Info Message', detail:'Message Content', life: 3000});
    }
  },
  components: {
    Editor
  }
}
</script>

<style>

</style>
