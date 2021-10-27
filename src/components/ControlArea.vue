<template>
  <div style="overflow: hidden" :style="{flex: width, display: 'flex', flexDirection: 'column'}">
    <Splitter layout="vertical" :style="{flex: 1}" style="overflow: hidden;width: 100%;">
      <SplitterPanel :size="50" style="overflow: hidden;">  
        <app-preview ref="preview"/>
      </SplitterPanel>
      <SplitterPanel :size="50" style="overflow: hidden;" :style="{display: 'flex', flexDirection: 'column'}">
        <Outline :style="{flex: 1}" ref="outline"/>
      </SplitterPanel>
    </Splitter>
    <div style="position: absolute; right: 0; bottom: 0; text-align: center; min-height: 1cm">
      <button class="pi pi-refresh" @click="$refs.preview.reload()" style="min-width: 3em; height: 100%; border-radius: 0"></button>
    </div>
  </div>
</template>

<script>
import AppPreview from './AppPreview.vue'
import Outline from './Outline.vue'

  export default {
    components: { AppPreview, Outline },
    props: {
      width: {
        type: Number,
        default: 5
      }
    }
  }
</script>