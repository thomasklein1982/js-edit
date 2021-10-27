<template>
  <div ref="wrapper" :style="{flex: 1}" style="width: 100%; height: 100%;">
  </div>
  
</template>
<script>
  export default {
    methods: {
      reload(){
        let frame=document.createElement('iframe');
        frame.style="width: 100%; height: 100%;";
        if(this.$refs.wrapper.firstChild){
          this.$refs.wrapper.removeChild(this.$refs.wrapper.firstChild);
        }
        this.$refs.wrapper.appendChild(frame);
        let src=this.$root.sourceCode;
        //let code='\<script src="https://thomaskl.uber.space/Webapps/AppJS/app.js?a=2"\>\</script\>\n\<script\>'+src+'\n\</script\>';
        let code="\<script\>"+window.appJScode;
        code+='\nfunction setupApp(){alert(2)}\</script\>\n\<script\>'+src+'\n\</script\>';
        let doc=frame.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }
</script>