<template>
  <div style="overflow: auto" class="outline">
    <button :style="{color: f.alreadyDefined? 'red':''}" style="font-family: monospace; width: 100%; min-height: 1cm; border-radius: 0; text-align: left" @click="$emit('click',f)" v-for="(f,i) in outline" :key="i">
      {{f.name}}({{f.params.join(",")}}) <span v-if="f.alreadyDefined">Fehler: bereits definiert!</span>
    </button>
    <button :style="{color: c.alreadyDefined? 'red':''}" style="margin-top: 0.5rem; font-family: monospace; width: 100%; min-height: 1cm; border-radius: 0; text-align: left" @click="$emit('click',c)" v-for="(c,i) in clazzes" :key="i">
      Klasse {{c.name}} <span v-if="c.alreadyDefined">Fehler: bereits definiert!</span>
    </button>
  </div>
</template>

<script>
  export default {
    data(){
      return {
        outline: [],
        clazzes: []
      };
    },
    methods: {
      update(outline,clazzes){
        this.outline=outline;
        this.clazzes=clazzes;
      }
    }
  }
</script>