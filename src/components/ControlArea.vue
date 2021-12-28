<template>
  <div style="overflow: hidden" :style="{flex: width, display: 'flex', flexDirection: 'column'}">
    <Splitter layout="vertical" :style="{flex: 1}" style="overflow: hidden;width: 100%;">
      <SplitterPanel style="overflow: hidden;">
        <app-preview :paused="paused" :breakpoints="breakpoints" ref="preview"/>
      </SplitterPanel>
      <SplitterPanel style="overflow: hidden;" :style="{display: 'flex', flexDirection: 'column'}">
        <Outline 
          @click="outlineClick"
          :style="{flex: 1}" 
          ref="outline"
        />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<script>
import AppPreview from './AppPreview.vue'
import Outline from './Outline.vue'

  export default {
    components: { AppPreview, Outline },
    props: {
      breakpoints: Object,
      paused: {
        type: Boolean,
        default: false
      },
      width: {
        type: Number,
        default: 5
      }
    },
    methods: {
      play(){
        this.$refs.preview.reload();
      },
      resume(){
        this.$refs.preview.resume();
      },
      step(){
        this.$refs.preview.step();
      },
      stop(){
        this.$refs.preview.stop();
      },
      outlineClick(item){
        this.$emit('outlineclick',item);
      },
      updateOutline(outline){
        this.$refs.outline.update(outline);
      }
    }
  }
</script>