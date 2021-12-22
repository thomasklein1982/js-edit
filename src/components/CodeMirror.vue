<template>
  <div id="root">
    <div id="editor" ref="editor" :style="{fontSize: (0.55*fontSize+5)+'px'}"></div>
    <div>{{currentPos}}</div>
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
  import { createAutocompletion,createParamsString } from "../lib/snippets";
  import  * as autocomplete  from "@codemirror/autocomplete";
  import {CompletionContext} from "@codemirror/autocomplete";
  import {autocompletion} from "@codemirror/autocomplete";
  import {StateField, StateEffect} from "@codemirror/state"
  import {RangeSet} from "@codemirror/rangeset"
  import {gutter, GutterMarker} from "@codemirror/gutter"
  import {Decoration,ViewPlugin} from "@codemirror/view"


  // function highlightCurrentLine() {
  //   return currentLineHighlighter;
  // }
  // const lineDeco = Decoration.line({ attributes: { class: "cm-currentLine" } });
  // const currentLineHighlighter = ViewPlugin.fromClass(class {
  //     constructor(view) {
  //         this.decorations = this.getDeco(view);
  //     }
  //     update() {
  //       this.decorations = this.getDeco();
  //     }
  //     getDeco() {
  //       if(!app.paused || app.currentPos<0){
  //         return Decoration.none;
  //       }
  //       // let lastLineStart = -1, deco = [];
  //       let deco=[];
  //       deco.push(lineDeco.range(app.currentPos));
  //       // for (let r of view.state.selection.ranges) {
  //       //     if (!r.empty)
  //       //         return Decoration.none;
  //       //     let line = view.visualLineAt(r.head);
  //       //     if (line.from > lastLineStart) {
  //       //         deco.push(lineDeco.range(line.from));
  //       //         lastLineStart = line.from;
  //       //     }
  //       // }
  //       return Decoration.set(deco);
  //     }
  // }, {
  //     decorations: v => v.decorations
  // });

  const breakpointEffect = StateEffect.define({
    map: (val, mapping) => ({pos: mapping.mapPos(val.pos), on: val.on})
  })

  const breakpointState = StateField.define({
    create() { return RangeSet.empty },
    update(set, transaction) {
      set = set.map(transaction.changes)
      for (let e of transaction.effects) {
        if (e.is(breakpointEffect)) {
          if (e.value.on)
            set = set.update({add: [breakpointMarker.range(e.value.pos)]})
          else
            set = set.update({filter: from => from != e.value.pos})
        }
      }
      return set
    }
  })

  function toggleBreakpoint(view, line) {
    let pos=line.from;
    line=view.state.doc.lineAt(pos)
    let breakpoints = view.state.field(breakpointState);
    let hasBreakpoint = false;
    breakpoints.between(pos, pos, () => {hasBreakpoint = true});
    view.dispatch({
      effects: breakpointEffect.of({pos, on: !hasBreakpoint})
    });
    /*Fuehrenden Whitespace herausrechnen:*/
    let text=line.text;
    if(text.trim().length===0){
      app.toggleBreakpoint(pos,false);
      return;
    }
    let wscount=0;
    for(let i=0;i<text.length;i++){
      if(!(/\s/.test(text.charAt(i)))){
        wscount=i;
        break;
      }
    }
    app.toggleBreakpoint(pos+wscount,!hasBreakpoint);
  }

  const breakpointMarker = new class extends GutterMarker {
    toDOM() { return document.createTextNode("⬤") }
  }

  const breakpointGutter = [
    breakpointState,
    gutter({
      class: "cm-breakpoint-gutter",
      markers: v => v.state.field(breakpointState),
      initialSpacer: () => breakpointMarker,
      domEventHandlers: {
        mousedown(view, line) {
          toggleBreakpoint(view, line)
          return true
        }
      }
    }),
    EditorView.baseTheme({
      ".cm-breakpoint-gutter .cm-gutterElement": {
        color: "red",
        paddingLeft: "5px",
        cursor: "default"
      },
      ".cm-currentLine": {backgroundColor: "#121212", color: "white"}
    })
  ]

  const additionalCompletions=[];

  export default {
    props: {
      autocompleteVariables: {
        type: Boolean,
        default: true
      },
      currentPos: {
        type: Number,
        default: -1
      }
    },
    watch: {
      currentPos(nv,ov){
        if(nv<0 && ov>=0){
          this.setCursor(ov);
        }else{
          let line=this.state.doc.lineAt(nv)
          try{
            this.setSelection(line.from,line.to+1);
          }catch(e){
            this.setSelection(line.from,line.to);
          }
        // currentLineHighlighter.update()
        }
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

      let editor=new EditorView({
        state: EditorState.create({
          doc: "",
          extensions: [
            basicSetup,
            //highlightCurrentLine(),
            breakpointGutter,
            EditorView.lineWrapping,
            indentUnit.of("  "),
            javascript(),
            autocompletion({override: [createAutocompletion(additionalCompletions)]}),
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
        while(additionalCompletions.length>0){
          additionalCompletions.pop();
        }
        
        for(let i=0;i<infos.outline.length;i++){
          let f=infos.outline[i];
          let s=autocomplete.snippetCompletion(f.name+createParamsString(f.params,true), {
            label: f.name+"("+f.params.join(",")+")",
            info: "Diese Funktion hast du definiert.",
            type: "function"
          });
          additionalCompletions.push(s);
        }
        /**Variablen*/
        for(let a in infos.variables){
          let s=autocomplete.snippetCompletion(a, {
            label: a,
            info: "Eine Variable aus deinem Programm.",
            type: "variable"
          });
          additionalCompletions.push(s);
        }
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
        this.check();
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
        this.check();
      },
      setRuntimeError: function(error){
        this.runtimeError=error;
      },
      setCursor: function(position){
        //this.editor.focus();
        this.editor.dispatch({
          selection: new EditorSelection([EditorSelection.cursor(position)], 0),
          scrollIntoView: true
        });
      },
      setSelection(anchor,head){
        this.editor.dispatch({
          selection: {anchor, head},
          scrollIntoView: true
        })
      },
      focus(){
        this.editor.focus();
      },
      async check(){
        let src=this.$root.sourceCode;
        let infos=await parse(src,this.state.tree,{dontParseGlobalVariables: !this.autocompleteVariables});
        this.$root.sourceCodeDebugging=infos.code;
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