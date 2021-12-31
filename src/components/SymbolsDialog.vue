<template>
  <Dialog header="Sonderzeichen und Unicode-Symbole" v-model:visible="show"  :maximizable="true" :modal="true">
    <Dropdown style="width: 100%" placeholder="Wähle eine Zeichenmenge" v-model="set" :options="sets" optionLabel="name"/>
    <div class="p-field-checkbox">
      <SelectButton v-model="mode" :options="modes" optionLabel="name" />
    </div>
    <div :style="{flex: 1}" v-if="set" style="width: 100%; overflow-y: auto">
      <Button class="copy p-button-outlined" :data-clipboard-text="s" style="margin: 0.2rem" @click="clickSymbol(s)" v-for="(s,i) in symbols" :label="s"/>
    </div>
  </Dialog>
</template>

<script>
export default {
  data(){
    return {
      show: false,
      mode: null,
      modes: [
        {
          name: 'Nur kopieren'
        },
        {
          name: 'Direkt einfügen'
        }
      ],
      sets: [
        {name: 'Smileys', from: 0x1f600, to: 0x1f64f},
        {name: 'Verschiedene Emojis', from: 0x1f300, to: 0x1f5ff},
        {name: 'Fahrzeuge und Verkehr', from: 0x1f680, to: 0x1f6ff},
        {name: 'Spielkarten', from: 0x1f0a0, to: 0x1f0ff},
        {name: 'Pfeile', from: 0x2190, to: 0x21FF},
        {name: 'Technische Zeichen', from: 0x2300, to: 0x23FF},
        {name: 'Buchstabenähnliche Symbole', from: 0x2100, to: 0x214f},
        {name: 'Umschlossene Buchstaben und Ziffern', from: 0x2460, to: 0x24FF},
        {name: 'Geometrische Formen', from: 0x25A0, to: 0x25FF},
        {name: 'Verschiedene Symbole', from: 0x2600, to: 0x26FF},
        {name: 'Dingbats', from: 0x2700, to: 0x27bf},
        {name: 'Verschiedene Symbole und Pfeile', from: 0x2B00, to: 0x2BFF},
        {name: 'Chinesisch, Japanisch, Koreanisch', from: 0x3000, to: 0x303F},
      ],
      set: null
    };
  },
  mounted(){
    this.mode=this.modes[0];
  },
  computed: {
    symbols(){
      if(!this.set) return [];
      let array=[];
      for(let i=this.set.from;i<=this.set.to;i++){
        array.push(String.fromCodePoint(i));
      }
      return array;
    }
  },
  methods: {
    clickSymbol(s){
      if(this.mode===this.modes[1]){
        this.$emit("paste",s);
        this.$root.toast({severity: 'success', summary: 'Eingefügt!', life: '1000'});
        this.setVisible(false);
      }else{
        this.$root.toast({severity: 'success', summary: 'Kopiert!', life: '1000'});
      }
      
    },
    setVisible(v){
      this.show=v;
    }
  }
}
</script>