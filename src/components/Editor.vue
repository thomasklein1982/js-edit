<template>
  <div style="width: 100%; height: 100%; overflow: hidden" :style="{display: 'flex', flexDirection: 'column'}">
    <editor-menubar @new="$refs.editor.reset()"/>
    <div :style="{display: 'flex', flexDirection: 'row', flex: 1}">
      <code-mirror ref="editor"/>
      <control-area/>
    </div>
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
  components: {
    CodeMirror,
    EditorMenubar,
    ControlArea
  }
}
</script>