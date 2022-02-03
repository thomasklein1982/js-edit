<template>
  <Dialog header="Teilen" v-model:visible="show" :style="{width: '50vw'}" :maximizable="true" :modal="true">
      <p class="p-m-0">
        Das untenstehende Bild enthält deinen gesamten Programmcode. Du kannst es auf deinem Gerät speichern oder mit anderen teilen.
      </p>
      <div style="text-align: center">
        <img ref="output" src="/icon.png" style="border: 1pt solid black; width: 70%; min-height: 2cm">
      </div>
      <div>
        <a ref="download">Download</a>
      </div>
  </Dialog>
</template>

<script>
import {nextTick} from 'vue';
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
      
      imagifier.toImage(JSON.stringify({type: "JSEdit-App", code: app.sourceCode}),codeStart,10,"white","black","JS-Edit");
    }
  }
}
</script>