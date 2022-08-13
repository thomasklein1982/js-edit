<template>
  <Toast />
  <Editor :current-line="currentLine" :paused="paused" :breakpoints="breakpoints" ref="editor"/>
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
      version: "61",
      breakpoints: [],
      paused: false,
      currentLine: -1
    };
  },
  setup(){
    toast=useToast();
  },
  methods: {
    updateBreakpoints(breakpointSet,document){
      var n=breakpointSet.size;
      var iter=breakpointSet.iter(0);
      let bp=[];
      for(let i=0;i<n;i++){
        let pos=iter.from;
        let line=document.lineAt(pos);
        bp.push(
          line.number
        );
        iter.next();
      }
      this.breakpoints=bp;
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
