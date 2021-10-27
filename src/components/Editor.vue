<template>
  <div style="width: 100%; height: 100%; overflow: hidden" :style="{display: 'flex', flexDirection: 'column'}">
    <editor-menubar @export="exportApp()" @new="$refs.editor.reset()"/>
    <Splitter :style="{flex: 1}" style="overflow: hidden;width: 100%;">
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">
        <code-mirror ref="editor"/>
      </SplitterPanel>
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">  
        <control-area/>
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<script>
import CodeMirror from "./CodeMirror.vue";
import EditorMenubar from './EditorMenubar.vue';
import ControlArea from "./ControlArea.vue";
export default {
  data() {
    return {
      a: 1
    };
  },
  methods: {
    exportApp(){

    }
  },
  components: {
    CodeMirror,
    EditorMenubar,
    ControlArea
  }
}
</script>