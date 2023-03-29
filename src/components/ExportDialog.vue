<template>
  <Dialog header="Exportierte App" v-model:visible="show" :style="{width: '50vw'}" :maximizable="true" :modal="true">
      <p class="p-m-0">
        Dieser Programmcode kann in einem modernen Browser ausgeführt werden. Du kannst ihn z. B. in <a href="https://glitch.com" target="_blank">Glitch</a> in die index.html kopieren.
      </p>
      <textarea id="exportarea" style="width: 100%; min-height: 50vh" :value="code"></textarea>
      <template #footer>
        <Button label="Herunterladen" icon="pi pi-download" @click="download()"/> <Button class="copy" label="Kopieren!" data-clipboard-target="#exportarea" icon="pi pi-copy" @click="copy()"/>
      </template>
  </Dialog>
</template>

<script>
  import { download } from '../lib/helper';

export default {
  data(){
    return {
      show: false
    };
  },
  computed: {
    code: function(){
      let c=this.$root.sourceCode;
      c='\<script src="https://thomaskl.uber.space/Webapps/AppJS/app.js"\>\</script\>\n\<script\>\nconsole.hide()\n\n'+c+'\n\</script\>';
      return c;
    }
  },
  methods: {
    download(){
      console.log(app);
      let js=this.$root.sourceCode;
      js="\<script\>"+window.appJScode+"\nconsole.hide();\n/*JS-EDIT-START*/"+js+"/*JS-EDIT-END*/\</script\>";
      let code='\<!doctype html\>\<html\>\<head\>\<meta charset="utf-8"\>'+js+'\</head\>\</html\>';
      download(code,"App"+".htm","text/html");
    },
    setVisible(v){
      this.show=v;
    },
    copy(){
      this.$root.toast({summary: 'Kopiert!', detail: 'Du kannst den Code jetzt anderswo einfügen.', life: 4000, severity: 'success'});
    }
  }
}
</script>