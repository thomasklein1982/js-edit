<template>
  <div id="root">
    <div id="editor" ref="editor"></div>
    <div v-if="errors || runtimeError" id="errors">
      <div v-if="errors"><span style="color: red" class="pi pi-exclamation-circle"></span>{{errors}}</div> 
      <div v-if="runtimeError" @click="runtimeError=null"><span style="color: red" class="pi pi-exclamation-circle"></span>{{runtimeError}}</div>
    </div>
  </div>
  
</template>

<script>
  import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
  import { javascript, snippets } from "@codemirror/lang-javascript";
  import {keymap} from "@codemirror/view"
  import {indentWithTab} from "@codemirror/commands"
  import { indentUnit } from "@codemirror/language";
  import * as acorn from "acorn";
  import { loadLocally, saveLocally } from "../lib/helper";
  import { prepareSnippets } from "../lib/snippets";
  
  prepareSnippets(snippets);

  export default {
    props: {
      project: Object
    },
    data(){
      return {
        src: '',
        size: 0,
        editor: null,
        errors: null,
        runtimeError: null
      };
    },
    async mounted(){
      let changed=false;
      let timer;
      let saved=await loadLocally("js-edit-current");
      if(saved){
        this.$root.sourceCode=saved;
      }else{
        this.$root.sourceCode='setupApp("Name meiner App", "😀", 100, 100, "aqua");\n\nfunction onStart(){\n  drawCircle(50,50,10)\n}';
      }
      let editor=new EditorView({
        state: EditorState.create({
          doc: "",
          extensions: [
            basicSetup,
            EditorView.lineWrapping,
            indentUnit.of("  "),
            javascript(),
            keymap.of([indentWithTab]),
            EditorView.updateListener.of((v) => {
              if(!changed){
                changed=v.docChanged;
              }
              if(changed){
                this.size=v.state.doc.length;
              }
              if(timer) clearTimeout(timer);
              timer = setTimeout(() => {
                if (changed) {
                  this.update(v);
                  changed=false;
                }
              }, 500 );
            }),
          ]
        }),
        parent: this.$refs.editor
      });
      this.editor=editor;
      this.editor.dispatch({
        changes: {from: 0, to: 0, insert: this.$root.sourceCode}
      });
    },
    methods: {
      reset: function(){
        this.runtimeError=null;
        this.$root.sourceCode='setupApp("Name meiner App", "😀", 100, 100, "aqua");\n\nfunction onStart(){\n  drawCircle(50,50,10)\n}';
        this.editor.dispatch({
          changes: {from: 0, to: this.size, insert: this.$root.sourceCode}
        });
      },
      setRuntimeError: function(error){
        this.runtimeError=error;
      },
      check(){
        let src=this.$root.sourceCode;
        let p=new Promise((resolve,reject)=>{
          try{
            let ast=acorn.parse(src, {ecmaVersion: 2020});
            resolve(false);
          }catch(e){
            resolve(e);
          }
        }).then((errors)=>{
          if(errors){
            let t="Zeile "+errors.loc.line+": ";
            if(errors.message.startsWith("Unexpected token")){
              if(errors.pos>=this.$root.sourceCode.length){
                t+="Unerwartes Ende des Codes. Fehlt eine '}'?"
              }else{
                t+="Unerwartetes Zeichen";
              }
              
            }else{
              t+=errors.message;
            }
            this.errors=t;
          }else{
            this.errors=null;
          }
        });
      },
      update(viewUpdate){
        var state=viewUpdate.state;
        var src=state.doc.toString();
        this.$root.sourceCode=src;
        saveLocally("js-edit-current",src);
        this.check();
      }
    }
  }
</script>

<style scoped>
  #root{
    flex: 10;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
  }
  #editor{
    flex: 1;
    overflow-y:auto;
    display: flex;
    flex-direction: column;
  }
  #errors{
    color: red;
  }
</style>

<style>
  .cm-editor{
    flex: 1;
  }
  #errors{
    font-family: monospace;
  }
</style>