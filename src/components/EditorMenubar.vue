<template>
  <Menubar :model="items">
    <template #start>
      <img alt="logo" src="../assets/icon-transparent.png" height="40" >
    </template>
    <template #end>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-star" @click="$emit('unicode')"/>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-search" @click="$emit('search')"/>
      <Button class="p-button-secondary" style="margin-right: 0.5rem" label="" icon="pi pi-undo" @click="$emit('undo')"/>
      <Button class="p-button-secondary" label="" icon="pi pi-refresh" @click="$emit('redo')"/>
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
          command: (ev)=>{
            let a=confirm("Willst du wirklich ein komplett neues Programm erstellen? Alle Eingaben gehen verloren.");
            if(a){
              this.$emit("new");
            }
          }
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
    updateItems(){
    } 
  }
}
</script>

<style scoped>

</style>