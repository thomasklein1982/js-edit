<template>
  <export-dialog ref="exportDialog"/>
  <settings-dialog 
    ref="settingsDialog"
    @fontsize="setFontSize"
    @autocompletevariables="setAutocompleteVariables"
  />
  <projects-dialog
    ref="projectsDialog"
    @load="loadApp"
  />
  <div style="width: 100%; height: 100%; overflow: hidden" :style="{display: 'flex', flexDirection: 'column'}">
    <editor-menubar 
      @play="runApp()" 
      @export="exportApp()"
      @prettify="prettifyCode()"
      @projects="$refs.projectsDialog.setVisible(true)"
      @settings="$refs.settingsDialog.setVisible(true)" 
      @new="$refs.editor.reset()"
    />
    <Splitter :style="{flex: 1}" style="overflow: hidden;width: 100%;">
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">
        <code-mirror 
          ref="editor"
          :current-pos="paused ? currentPos : -1"
          :autocomplete-variables="autocompleteVariables"
          @parse="updateOutline"
        />
      </SplitterPanel>
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">  
        <control-area
          @outlineclick="outlineClick"
          :paused="paused"
          :breakpoints="breakpoints" 
          ref="controlArea"
        />
      </SplitterPanel>
    </Splitter>
  </div>
  <span style="position: fixed; bottom: 0.5rem; right: 0.5rem" class="p-buttonset">
      <Button :disabled="running && !paused" @click="resume()" icon="pi pi-play" />
      <Button v-if="paused" @click="step()" icon="pi pi-arrow-right" />
      <Button v-if="running" @click="stop()" icon="pi pi-times" />
  </span>
</template>

<script>
import CodeMirror from "./CodeMirror.vue";
import EditorMenubar from './EditorMenubar.vue';
import ControlArea from "./ControlArea.vue";
import ExportDialog from "./ExportDialog.vue";
import SettingsDialog from "./SettingsDialog.vue";
import ProjectsDialog from './ProjectsDialog.vue';

export default {
  props: {
    breakpoints: Object,
    paused: {
      type: Boolean,
      default: false
    },
    currentPos: {
      type: Number,
      default: -1
    }
  },
  data() {
    return {
      fontSize: 20,
      autocompleteVariables: true,
      running: false
    };
  },
  methods: {
    loadApp(sourceCode){
      this.$refs.editor.setCode(sourceCode);
    },
    resume(){
      this.$root.currentPos=-1;
      if(this.paused){
        this.$root.paused=false;
        this.$refs.controlArea.resume();
      }else if(!this.running){
        this.runApp();
      }
    },
    step(){
      this.$root.currentPos=-1;
      this.$refs.controlArea.step();
    },
    stop(){
      this.$refs.controlArea.stop();
      this.$root.paused=false;
      this.running=false;
      this.$root.currentPos=-1;
    },
    outlineClick(info){
      if('from' in info){
        this.$refs.editor.focus();
        this.$refs.editor.setCursor(info.from);
      }
    },
    updateOutline(infos){
      this.$refs.controlArea.updateOutline(infos.outline);
      this.$refs.editor.updateAutocompletionSnippets(infos);
    },
    setAutocompleteVariables(v){
      this.autocompleteVariables=v;
    },
    setFontSize(fs){
      console.log("setFontsize");
      this.$refs.editor.setFontSize(fs);
    },
    exportApp(){
      this.$refs.exportDialog.setVisible(true);
    },
    runApp(){
      this.running=true;
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
    SettingsDialog,
    ProjectsDialog
  }
}
</script>

<style>
  .p-buttonset {
    .p-button {
        margin-right: 0;
    }
  }
</style>