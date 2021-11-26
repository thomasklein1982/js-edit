<template>
  <div style="overflow: auto" class="outline">
    <button :style="{color: f.alreadyDefined? 'red':''}" style="font-family: monospace; width: 100%; min-height: 1cm; border-radius: 0; text-align: left" @click="$emit('click',f)" v-for="(f,i) in outline" :key="i">
      {{f.name}}({{f.params.join(",")}}) <span v-if="f.alreadyDefined">doppelt!</span>
    </button>
  </div>
</template>

<script>
  export default {
    data(){
      return {
        outline: []
      };
    },
    methods: {
      update(outline){
        this.outline=outline;
      }
    }
  }
</script>