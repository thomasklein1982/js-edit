<template>
  <div :style="{flex: 1}" style="position: relative; width: 100%; height: 100%;">
    <div ref="wrapper" style="width: 100%; height: 100%;"></div>
    <div v-if="paused" style="position: absolute; top: 3px; right: 3px">Angehalten...</div>
  </div>
</template>
<script>
  export default {
    props: {
      breakpoints: Array,
      paused: {
        type: Boolean,
        default: false
      }
    },
    watch: {
      breakpoints: {
        deep: true,
        handler(nv){
          if(this.frame){
            this.frame.contentWindow.postMessage({
              type: "breakpoints",
              breakpoints: JSON.parse(JSON.stringify(nv))
            });
          }
        }
      }
    },
    data: function(){
      return {
        frame: null,
        variables: {}
      }
    },
    methods: {
      focus(){
        if(this.frame){
          this.frame.focus();
        }
      },
      setVariables(variables){
        this.variables=[];
        for(var a in variables){
          this.variables.push(a);
        }
      },
      resume(){
        if(this.frame){
          this.frame.contentWindow.postMessage({
            type: "debug-resume"
          });
        }
      },
      step(){
        this.$root.currentLine=-1;
        this.frame.contentWindow.postMessage({
          type: "debug-step"
        });
      },
      stop(){
        if(this.$refs.wrapper.firstChild){
          this.$refs.wrapper.removeChild(this.$refs.wrapper.firstChild);
        }
        this.frame=null;
      },
      reload(debugging){
        let frame=document.createElement('iframe');
        frame.style="width: 100%; height: 100%;";
        if(this.$refs.wrapper.firstChild){
          this.$refs.wrapper.removeChild(this.$refs.wrapper.firstChild);
        }
        this.$refs.wrapper.appendChild(frame);
        let bp=this.breakpoints;
        let src="$App.debug.setBreakpoints("+JSON.stringify(bp)+");";
        src+="$App.console.addWatchedVariables("+JSON.stringify(this.variables)+");";
        if(debugging){
          src+=this.$root.sourceCodeDebugging;
        }else{
          src+=this.$root.sourceCode;
        }
        let code="\<script\>";
        if(debugging){
          code+="appJSdebugMode=true;";
        }
        code+=window.appJScode;
        code+='\n\</script\>\n\<script\>'+src+'\n\</script\>';
        let doc=frame.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
        this.frame=frame;
      }
    }
  }
</script>