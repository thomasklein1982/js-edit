<template>
  <Dialog header="Exportierte App" v-model:visible="show" :style="{width: '50vw'}" :maximizable="true" :modal="true">
      <p class="p-m-0">
        Dieser Programmcode kann in einem modernen Browser ausgeführt werden. Du kannst ihn z. B. in Glitch in die index.html kopieren.
      </p>
      <textarea style="width: 100%; min-height: 50vh" :value="code"></textarea>
      <template #footer>
        <Button label="OK" icon="pi pi-check" @click="setVisible(false)"/>
      </template>
  </Dialog>
</template>

<script>
export default {
  data(){
    return {
      show: false
    };
  },
  computed: {
    code: function(){
      let c=this.$root.sourceCode;
      c='\<script src="https://thomaskl.uber.space/Webapps/AppJS/app.js"\>\</script\>\n\<script\>\n'+c+'\n\</script\>';
      return c;
    }
  },
  methods: {
    setVisible(v){
      this.show=v;
    }
  }
}
</script>