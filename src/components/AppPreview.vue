<template>
  <iframe style="width: 100%; height: 100%;" ref="preview" :style="{flex: 1}">
  </iframe>
  <button @click="reload()" style="border-radius: 0">N</button>
</template>
<script>
  export default {
    methods: {
      reload(){
        let src=this.$root.sourceCode;
        //let code='\<script src="https://thomaskl.uber.space/Webapps/AppJS/app.js?a=2"\>\</script\>\n\<script\>'+src+'\n\</script\>';
        let code="\<script\>"+window.appJScode;
        code+='\nfunction setupApp(){alert(2)}\</script\>\n\<script\>'+src+'\n\</script\>';
        let doc=this.$refs.preview.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }
</script>