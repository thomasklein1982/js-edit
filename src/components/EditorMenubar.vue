<template>
  <Menubar :model="items">
    <template #start>
      <img alt="logo" src="../assets/icon-transparent.png" height="40" >
    </template>
    <template #end>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-star" @click="$emit('unicode')"/>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-search" @click="$emit('search')"/>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-undo" @click="$emit('undo')"/>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-refresh" @click="$emit('redo')"/>
      <Button class="p-button-secondary"  label="" icon="pi pi-send" @click="$emit('share')"/>
    </template>
  </Menubar>  
</template>

<script>
import { upload } from '../lib/helper';
export default {
  data(){
    return {
      items: [
        // {
        //   label: 'Ausführen',
        //   icon: 'pi pi-fw pi-play',
        //   command: (ev)=>{
        //     this.$emit("play");
        //   }
        // },
        {
          label: 'Neu',
          icon: 'pi pi-fw pi-file',
          items: [
            {label: 'Hochladen', icon: 'pi pi-fw pi-upload', command:() => {this.$emit("upload")} },
            {label: 'Leeres Programm', icon: 'pi pi-fw pi-plus', command:() => {this.newProgram('')} },
            {label: 'Programm mit Grafik', icon: 'pi pi-fw pi-plus', command:() => {this.newProgram('setupApp("Name meiner App", "😀", 100, 100, "aqua");\n\nfunction onStart(){\n  drawCircle(50,50,20)\n  write("Hallo 😀",50,50)\n}')} },
            {label: 'Spiel mit Gamepad-Steuerung', icon: 'pi pi-fw pi-plus', command:() => {this.newProgram('setupApp("Name meiner App", "😀", 100, 100, "aqua");\n\nfunction onStart(){\n  gamepad.show();\n  x=50;\n  y=50;\n}\nfunction onNextFrame(){\n  clear()\n  if(gamepad.left){\n    x=x-1;\n  }\n  if(gamepad.right){\n    x=x+1;\n  }\n  if(gamepad.up){\n    y=y+1;\n  }\n  if(gamepad.down){\n    y=y-1;\n  }\n  write("😀",x,y)\n}\n\nfunction onGamepadDown(button){\n  if(button=="A"){\n    x=random(10,90)\n  }\n}')} }
          ]
        },
        {
          label: 'Projekte',
          icon: 'pi pi-folder',
          command: (ev)=>{
            this.$emit("projects");
          }
        },
        {
          label: 'Formatieren',
          icon: 'pi pi-fw pi-align-left',
          command: (ev)=>{
            this.$emit("prettify");
          }
        },
        
        {
          label: 'Exportieren',
          icon: 'pi pi-sign-out',
          command: async (ev)=>{
            this.$emit("export");
          }
        },
        // {
        //   label: 'Hochladen',
        //   icon: 'pi pi-upload',
        //   command: async (ev)=>{
        //     let f=await upload();
        //     if(f){
        //       this.$emit("upload",f);
        //     }
        //   }
        // },
        // {
        //   label: 'Herunterladen',
        //   icon: 'pi pi-download',
        //   command: (ev)=>{
        //     this.$emit('download');
        //   }
        // },
        {
          label: 'Einstellungen',
          icon: 'pi pi-cog',
          command: (ev)=>{
            this.$emit("settings");
          }
        },
        // {
        //   label: 'Rückgängig',
        //   icon: 'pi pi-undo',
        //   command: (ev)=>{
        //     this.$emit("undo");
        //   }
        // },
        // {
        //   label: 'Wiederholen',
        //   icon: 'pi pi-refresh',
        //   command: (ev)=>{
        //     this.$emit("redo");
        //   }
        // }
        // {
        //   label: 'Neu laden',
        //   icon: 'pi pi-refresh',
        //   command: (ev)=>{
        //     location.reload();
        //   }
        // }
      ]
    };
  },
  methods: {
    newProgram(code){
      let a=confirm("Willst du wirklich ein neues Programm erstellen? Der alte Code geht dabei verloren!");
      if(a){
        this.$emit('new',code);
      }
    } 
  }
}
</script>

<style scoped>

</style>