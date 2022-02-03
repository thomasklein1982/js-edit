<template>
  <Dialog header="App hochladen" v-model:visible="show" :style="{width: '50vw'}" :maximizable="true" :modal="true">
      <p class="p-m-0">
        Wähle ein Bild aus, das ein Programm enthält.
      </p>
      <div style="text-align: center">
        <Button @click="uploadProjects()" label="Hochladen" icon="pi pi-upload"/>
      </div>
  </Dialog>
</template>

<script>
import { upload} from "../lib/helper";
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
    setVisible(v){
      this.show=v;
      
      nextTick(()=>{
        if(v){
          this.updateImage();
        }
      });
    },
    updateImage(){
      let imagifier=new Imagifier(
        ()=>{},
        ()=>{},
        this.$refs.output,
        this.$refs.download
      )
      let code=app.sourceCode.trim();
      let text=[];
      let codeStart=code.substring(0,100).split('\n');
      codeStart.splice(0,0,"JSEdit v"+this.$root.version)
      codeStart.push("...");
      
      imagifier.toImage(app.sourceCode,codeStart,10,"white","black","JS-Edit");
    }
  }
}
</script>