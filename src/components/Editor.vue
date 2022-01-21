<template>
  <export-dialog ref="exportDialog"/>
  <settings-dialog 
    ref="settingsDialog"
    @fontsize="setFontSize"
    @autocompletevariables="setAutocompleteVariables"
    @downloadprojects="$refs.projectsDialog.downloadAllProjects()"
    @uploadprojects="$refs.projectsDialog.uploadProjects()"
  />
  <projects-dialog
    ref="projectsDialog"
    @load="loadApp"
  />
  <SymbolsDialog
    ref="symbolsDialog"
    @paste="insertSymbol"
  />
  <div style="width: 100%; height: 100%; overflow: hidden" :style="{display: 'flex', flexDirection: 'column'}">
    <editor-menubar 
      @play="runApp()" 
      @export="exportApp()"
      @prettify="prettifyCode()"
      @projects="$refs.projectsDialog.setVisible(true)"
      @settings="$refs.settingsDialog.setVisible(true)" 
      @new="$refs.editor.reset($event)"
      @undo="$refs.editor.undo()"
      @redo="$refs.editor.redo()"
      @search="$refs.editor.openSearchPanel()"
      @unicode="$refs.symbolsDialog.setVisible(true)"
    />
    <Splitter :style="{flex: 1}" style="overflow: hidden;width: 100%;">
      <SplitterPanel style="overflow: hidden; height: 100%" :style="{display: 'flex', flexDirection: 'column'}">
        <code-mirror 
          ref="editor"
          :current="paused ? currentLine : -1"
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
      <Button v-if="!running" @click="debug()" icon="pi pi-bolt" />
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
import SymbolsDialog from './SymbolsDialog.vue';

export default {
  props: {
    breakpoints: Array,
    paused: {
      type: Boolean,
      default: false
    },
    currentLine: {
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
    debug(){
      this.resume(true);
    },
    resume(debugging){
      this.$root.currentPos=-1;
      if(this.paused){
        this.$root.paused=false;
        this.$refs.controlArea.resume();
      }else if(!this.running){
        this.runApp(debugging);
      }
      this.$refs.controlArea.focusPreview();
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
    insertSymbol(s){
      this.$refs.editor.insert(s);
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
    runApp(debugging){
      this.running=true;
      this.$refs.editor.setRuntimeError();
      this.$refs.controlArea.play(debugging);
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
    ProjectsDialog,
    SymbolsDialog
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