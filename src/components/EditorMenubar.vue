<template>
  <Menubar :model="items">

  </Menubar>  
</template>

<script>
export default {
  data(){
    return {
      items: [
        {
          label: 'Projekt',
          icon: 'pi pi-fw pi-file',
          items: [
            {
              label: 'Neu',
              icon: 'pi pi-file',
              command: (ev)=>{
                
              }
            },
            {
              label: 'Hochladen',
              icon: 'pi pi-upload',
              command: (ev)=>{
                this.$emit('upload');
              }
            },
            {
              label: 'Herunterladen',
              icon: 'pi pi-download',
              command: (ev)=>{
                this.$emit('download');
              }
            }
          ]
        },
        {
          label: 'Ausführen',
          icon: 'pi pi-play',
          command: (ev)=>{
            this.$emit('run');
          }
        },
        {
          label: 'Einstellungen',
          icon: 'pi pi-cog',
          command: (ev)=>{
            
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