<template>
  <export-dialog ref="exportDialog"/>
  <settings-dialog 
    ref="settingsDialog"
    @fontsize="setFontSize"
  />
  <div style="width: 100%; height: 100%; overflow: hidden" :style="{display: 'flex', flexDirection: 'column'}">
    <editor-menubar 
      @play="runApp()" 
      @export="exportApp()"
      @prettify="prettifyCode()"
      @settings="$refs.settingsDialog.setVisible(true)" 
      @new="$refs.editor.reset()"
    />
    <Splitter :style="{flex: 1}" style="overflow: hidden;width: 100%;">
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">
        <code-mirror ref="editor"/>
      </SplitterPanel>
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">  
        <control-area ref="controlArea"/>
      </SplitterPanel>
    </Splitter>
  </div>
  
</template>

<script>
import CodeMirror from "./CodeMirror.vue";
import EditorMenubar from './EditorMenubar.vue';
import ControlArea from "./ControlArea.vue";
import ExportDialog from "./ExportDialog.vue";
import SettingsDialog from "./SettingsDialog.vue";
export default {
  data() {
    return {
      fontSize: 20
    };
  },
  methods: {
    setFontSize(fs){
      console.log("setFontsize");
      this.$refs.editor.setFontSize(fs);
    },
    exportApp(){
      this.$refs.exportDialog.setVisible(true);
    },
    runApp(){
      this.$refs.editor.setRuntimeError();
      this.$refs.controlArea.play()
    },
    prettifyCode(){
      this.$refs.editor.prettifyCode();
    }
  },
  components: {
    CodeMirror,
    EditorMenubar,
    ControlArea,
    ExportDialog,
    SettingsDialog
  }
}
</script>