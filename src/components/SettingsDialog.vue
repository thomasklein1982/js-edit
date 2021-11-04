<template>
  <Dialog header="Einstellungen" v-model:visible="show" :style="{width: '50vw'}" :maximizable="true" :modal="true">
      <p class="p-m-0">
        JS-Edit Version {{$root.version}}
      </p>
      <p class="p-m-0">
        <h4>Schriftgröße</h4>
        <Slider @change="changeFontSize()" v-model="fontSize" />
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
      fontSize: 20
    };
  },
  computed: {
    
  },
  methods: {
    changeFontSize(){
      this.$emit("fontsize",this.fontSize);
    },
    setVisible(v){
      this.show=v;
    }
  }
}
</script>