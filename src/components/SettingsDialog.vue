<template>
  <Dialog header="Einstellungen" v-model:visible="show"  :maximizable="true" :modal="true">
      <p class="p-m-0">
        JS-Edit Version {{$root.version}}
      </p>
      <p class="p-m-0">
        <Button label="Neu starten" icon="pi pi-undo" @click="restart()"/>
      </p>
      <h4>Schriftgröße</h4>
      <p class="p-m-0">
        <Slider @change="changeFontSize()" v-model="fontSize" />
      </p>
      <h4>Auto-Vervollständigung für globale Variablen</h4>
      <p class="p-m-0">
        <InputSwitch @change="changeAutocompleteVariables" v-model="autocompleteVariables" />
      </p>
      <template #footer>
        <Button label="OK" icon="pi pi-check" @click="setVisible(false)"/>
      </template>
  </Dialog>
</template>

<script>
export default {
  data(){
    return {
      show: false,
      fontSize: 20,
      autocompleteVariables: true
    };
  },
  computed: {
    
  },
  methods: {
    changeFontSize(){
      this.$emit("fontsize",this.fontSize);
    },
    changeAutocompleteVariables(){
      this.$emit("autocompletevariables",this.autocompleteVariables);
    },
    setVisible(v){
      this.show=v;
    },
    restart(){
      location.reload();
    }
  }
}
</script>