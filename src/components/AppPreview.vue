<template>
  <div ref="wrapper" :style="{flex: 1}" style="width: 100%; height: 100%;"></div>
</template>
<script>
  export default {
    props: {
      breakpoints: Object
    },
    watch: {
      breakpoints: {
        deep: true,
        handler(){
          let bp=this.convertBreakpointsToArray(this.breakpoints)
          if(this.frame){
            this.frame.contentWindow.postMessage({
              type: "breakpoints",
              breakpoints: bp
            });
          }
        }
      }
    },
    data: function(){
      return {
        frame: null
      }
    },
    methods: {
      convertBreakpointsToArray(breakpointsObject){
        let bp=[];
        for(let a in this.breakpoints){
          bp.push(a*1);
        }
        return bp;
      },
      resume(){
        if(this.frame){
          this.frame.contentWindow.postMessage({
            type: "debug-resume"
          });
        }
      },
      step(){
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
      reload(){
        let frame=document.createElement('iframe');
        frame.style="width: 100%; height: 100%;";
        if(this.$refs.wrapper.firstChild){
          this.$refs.wrapper.removeChild(this.$refs.wrapper.firstChild);
        }
        this.$refs.wrapper.appendChild(frame);
        let src=this.$root.sourceCodeDebugging;
        let bp=this.convertBreakpointsToArray(this.breakpoints);
        src+="$App.debug.setBreakpoints("+JSON.stringify(bp)+");";
        //let code='\<script src="https://thomaskl.uber.space/Webapps/AppJS/app.js?a=2"\>\</script\>\n\<script\>'+src+'\n\</script\>';
        let code="\<script\>"+window.appJScode;
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