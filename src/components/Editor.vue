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
  <LinksDialog
    ref="linksDialog"
  />
  <ShareDialog
    ref="shareDialog"
  />
  <div style="width: 100%; height: 100%; overflow: hidden" :style="{display: 'flex', flexDirection: 'column'}">
    <editor-menubar 
      :right-closed="rightClosed"
      @upload="uploadApp()" 
      @export="exportApp()"
      @prettify="prettifyCode()"
      @projects="$refs.projectsDialog.setVisible(true)"
      @settings="$refs.settingsDialog.setVisible(true)" 
      @new="$refs.editor.reset($event)"
      @undo="$refs.editor.undo()"
      @redo="$refs.editor.redo()"
      @search="$refs.editor.openSearchPanel()"
      @unicode="$refs.linksDialog.setVisible(true)"
      @share="$refs.shareDialog.setVisible(true)"
      @toggleright="toggleRight()"
    />
    <Splitter :gutter-size="splitterSize" ref="splitter" @resizeend="handleResize" :style="{flex: 1}" style="overflow: hidden;width: 100%;">
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
          :splitter-size="splitterSize"
          ref="controlArea"
        />
      </SplitterPanel>
    </Splitter>
  </div>
  <span style="position: fixed; bottom: 0.5rem; right: 0.5rem" class="p-buttonset">
      <Button :disabled="running && !paused" @click="resume()" icon="pi pi-play" />
      <Button v-if="!running" @click="debug()" icon="editor-extra debug" />
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
import LinksDialog from './LinksDialog.vue';
import ShareDialog from './ShareDialog.vue'
import { upload} from "../lib/helper";

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
      running: false,
      sizeCode: 60,
      rightClosed: false,
      sizeCodeSaved: 60,
      closeRightAfterStopping: false,
      splitterSize: 8
    };
  },
  watch: {
    sizeCode(nv,ov){
      if(nv!==ov){
        this.setSplitterSizes(nv);
      }
    },
  },
  methods: {
    toggleRight(){
      if(!this.rightClosed){
        this.sizeCodeSaved=this.sizeCode;
        this.sizeCode=100;
      }else{
        this.sizeCode=Math.max(10,this.sizeCodeSaved);
      }
      this.rightClosed=!this.rightClosed;
    },
    setSplitterSizes(left){
      let s=this.$refs.splitter;
      s.panelSizes=[left,100-left];
      let children = [...s.$el.children];
      let j=0;
      children.forEach((child, i) => {
        if(child.className.indexOf("p-splitter-panel")>=0){
          child.style.flexBasis = 'calc(' + s.panelSizes[j] + '% - ' + ((s.panels.length - 1) * s.gutterSize) + 'px)';
          j++;
        }
      });
      this.sizeCode=left;
    },
    handleResize(ev){
      this.sizeCode=ev.sizes[0];
    },
    async uploadApp(){
      let img=await upload({dataURL: true});
      if(img){
        if(img.mime.indexOf("text")>=0){
          let code=img.code.substring(22);
          try{
            code=atob(code);
            let startToken="/*JS-EDIT-START*/";
            let stopToken="/*JS-EDIT-END*/";
            let start=code.indexOf(startToken);
            let stop=code.indexOf(stopToken);
            if(start>=0 && stop>=start){
              let js=code.substring(start+startToken.length,stop);
              this.$refs.editor.reset(js);
            }else{
              throw "kein JSEdit-Programm";
            }
          }catch(e){
            this.$root.toast({summary: 'Fehler', detail: 'Dies ist kein JSEdit-Programm!', life: 4000, severity: 'error'});
          }
          console.log(code);
        }else{
          let imagifier=new Imagifier(
            (data)=>{
              let error=false;
              try{
                data=JSON.parse(data);
                if(data.type==="JSEdit-App" && data.code!==undefined){
                  data=data.code;
                  this.$refs.editor.reset(data);
                }else{
                  error=true;
                }
              }catch(e){
                error=true;
              }
              if(error){
                this.$root.toast({summary: 'Fehler', detail: 'Dies ist kein JSEdit-Programm!', life: 4000, severity: 'error'});
              }else{
                this.$root.toast({summary: 'App hochgeladen', detail: '', life: 4000, severity: 'success'});
              }
            },
            ()=>{
              this.$root.toast({summary: 'Fehler', detail: 'Dies ist kein JSEdit-Programm!', life: 4000, severity: 'error'});
            }
          );
          imagifier.toTextFromDataURL(img.code);
        }
      }
    },
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
      this.$refs.controlArea.updateOutline(infos.outline,infos.clazzes);
      this.$refs.editor.updateAutocompletionSnippets(infos);
      this.$refs.controlArea.setVariables(infos.variables);
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
    async runApp(debugging){
      if(debugging){
        await this.$refs.editor.check(true);
      }
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
    LinksDialog,
    ShareDialog
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