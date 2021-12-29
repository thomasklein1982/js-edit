<template>
  <Menubar :model="items">

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
        {
          label: 'Neu laden',
          icon: 'pi pi-refresh',
          command: (ev)=>{
            location.reload();
          }
        }
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