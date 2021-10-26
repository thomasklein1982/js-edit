<template>
  <iframe ref="preview" :style="{flex: 1}">
  </iframe>
  <button @click="reload()" style="border-radius: 0">N</button>
</template>
<script>
  export default {
    methods: {
      reload(){
        let src=this.$root.sourceCode;
        let code='\<script src="https://thomaskl.uber.space/Webapps/AppJS/app.js"\>\</script\>\n\<script\>'+src+'\n\</script\>';
        let doc=this.$refs.preview.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }
</script>