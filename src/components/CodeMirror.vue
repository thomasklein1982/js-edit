<template>
  <div id="root">
    <div id="editor" ref="editor" :style="{fontSize: (0.55*fontSize+5)+'px'}"></div>
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
  import {EditorSelection,Compartment} from "@codemirror/state"
  import {indentWithTab} from "@codemirror/commands"
  import { indentUnit } from "@codemirror/language";
  import * as acorn from "acorn";
  import {parse} from '../lib/parse'
  import { loadLocally, saveLocally } from "../lib/helper";
  import { prepareSnippets,createParamsString } from "../lib/snippets";
  import  * as autocomplete  from "@codemirror/autocomplete";

  prepareSnippets(snippets);

  export default {
    props: {
      autocompleteVariables: {
        type: Boolean,
        default: true
      }
    },
    data(){
      return {
        src: '',
        language: null,
        fontSize: 20,
        state: null,
        view: null,
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


      this.language=new Compartment();
      let editor=new EditorView({
        state: EditorState.create({
          doc: "",
          extensions: [
            basicSetup,
            EditorView.lineWrapping,
            indentUnit.of("  "),
            this.language.of(javascript()),
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
    computed: {
      realFontsize(){
        let fs=this.fontSize;
        fs=Math.round(0.55*fs)+5;
        return fs;
      }
    },
    methods: {
      updateAutocompletionSnippets(infos){
        for(let i=0;i<snippets.length;i++){
          let s=snippets[i];
          if(s.isCustom){
            snippets.pop();
            i--;
          }
        }
        for(let i=0;i<infos.outline.length;i++){
          let f=infos.outline[i];
          let s=autocomplete.snippetCompletion(f.name+createParamsString(f.params,true), {
            label: f.name+"("+f.params.join(",")+")",
            info: "Diese Funktion hast du definiert.",
            type: "function"
          });
          s.isCustom=true;
          snippets.push(s);
        }
        /**Variablen*/
        for(let a in infos.variables){
          let s=autocomplete.snippetCompletion(a, {
            label: a,
            info: "Eine Variable aus deinem Programm.",
            type: "variable"
          });
          s.isCustom=true;
          snippets.push(s);
        }
        this.editor.dispatch({
          effects: this.language.reconfigure(javascript())
        });
      },
      prettifyCode(){
        var code=this.$root.sourceCode;
        code=js_beautify(code,{
          "indent_size": 2,
          "preserve_newlines": false,
          "space_in_paren": true,
          "space_in_empty_paren": true
        });
        this.$root.sourceCode=code;
        this.editor.dispatch({
          changes: {from: 0, to: this.size, insert: code}
        });
      },
      setFontSize(fs){
        this.fontSize=fs;
        
      },
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
      setCursor: function(position){
        this.editor.focus();
        this.editor.dispatch({
          selection: new EditorSelection([EditorSelection.cursor(position)], 0),
          scrollIntoView: true
        });
      },
      async check(){
        let src=this.$root.sourceCode;
        let infos=await parse(src,this.state.tree,{dontParseGlobalVariables: !this.autocompleteVariables});
        this.$emit("parse",infos);
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
        this.state=viewUpdate.state;
        this.view=viewUpdate.view;
        var src=this.state.doc.toString();
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