<template>
  <div id="root">
    <div id="editor" ref="editor" :style="{fontSize: (0.55*fontSize+5)+'px'}"></div>
    <Message v-for="(e,i) in runtimeError" severity="error" :key="'re'+errorID">{{e.line>0? 'Zeile '+e.line : 'Unbekannte Zeile'}}: {{e.message}}</Message>
  </div>
  
</template>

<script>
  import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
  import { javascript } from "@codemirror/lang-javascript";
  import {keymap} from "@codemirror/view"
  import {EditorSelection,Compartment} from "@codemirror/state"
  import {indentWithTab} from "@codemirror/commands"
  import { indentUnit } from "@codemirror/language";
  import { toggleComment } from "@codemirror/comment"
  import * as acorn from "acorn";
  import {parse} from '../lib/parse'
  import {undo, redo} from '@codemirror/history'
  import {openSearchPanel,closeSearchPanel} from '@codemirror/search'
  import { loadLocally, saveLocally } from "../lib/helper";
  import { createAutocompletion,createParamsString,snippets } from "../lib/snippets";
  import  * as autocomplete  from "@codemirror/autocomplete";
  import {CompletionContext} from "@codemirror/autocomplete";
  import {autocompletion} from "@codemirror/autocomplete";
  import {StateField, StateEffect} from "@codemirror/state"
  import {RangeSet} from "@codemirror/rangeset"
  import {gutter, GutterMarker} from "@codemirror/gutter"
  import {Decoration,ViewPlugin} from "@codemirror/view"
  import { lintGutter, linter, openLintPanel } from "@codemirror/lint";

  import {hoverTooltip} from "@codemirror/tooltip"

  export const wordHover = hoverTooltip((view, pos, side) => {
    let {from, to, text} = view.state.doc.lineAt(pos)
    let start = pos, end = pos
    let regexp=/[=+\-*\/%&|]/;
    let c=text[start-from-1];
    console.log(c);
    if(c===" "){
      start++;
      regexp=/[=+\-*\/%&|]/;
      c=text[start-from-1];
    }
    if(!regexp.test(c)){
      regexp=/\w|\./;
    }
    while (start > from && regexp.test(text[start - from - 1])) start--
    while (end < to && regexp.test(text[end - from])) end++
    if (start == pos && side < 0 || end == pos && side > 0){
      return null
    }
    let word=text.slice(start - from, end - from);
    let tip;
    if(word==="new"){
      tip="erzeugt ein neues Objekt";
    }else if(word==="Object"){
      tip="ein Objekt fasst mehrere Variablen zu einer zusammen";
    }else if(word==="=="){
      tip="vergleicht die beiden Objekte";
    }else if(word==="+"){
      tip="addiert die beiden Zahlen oder verkettet die beiden Zeichenketten";
    }else if(word==="="){
      tip="weist der Variablen links den Wert rechts zu";
    }else{
      for(let i=0;i<snippets.inFunction.length;i++){
        let s=snippets.inFunction[i];
        if(s.label===word+"(...)"||s.label===word){
          tip=s.info;
          break;
        }
      }
      for(let i=0;i<snippets.everywhere.length;i++){
        let s=snippets.everywhere[i];
        if(s.label===word+"(...)"||s.label===word){
          tip=s.info;
          break;
        }
      }
    }
    if(tip){
      return {
        pos: start,
        above: true,
        create(view) {
          let dom = document.createElement("div");
          dom.textContent = tip;
          return {dom};
        }
      };
    }else{
      return null;
    }
  });
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
        if (e.value.on){
          set = set.update({add: [breakpointMarker.range(e.value.pos)]})

        }else{
          set = set.update({filter: from => from != e.value.pos})
        }
        app.updateBreakpoints(set,transaction.startState.doc);
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
  let editor;
  
  export default {
    props: {
      autocompleteVariables: {
        type: Boolean,
        default: true
      },
      current: Number
    },
    watch: {
      current(nv,ov){
        if(nv<=0 && ov>0){
          this.setCursorToLine(ov);
        }else{
          let line=this.getLineByNumber(nv);
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
        errors: null,
        runtimeError: [],
        errorID: 1,
        isSearchPanelOpen: false
      };
    },
    async mounted(){
      let changed=false;
      let timer;
      let saved=await loadLocally("js-edit-current");
      if(saved){
        this.$root.sourceCode=saved;
      }else{
        this.$root.sourceCode='setupApp("Name meiner App", "😀", 100, 100, "aqua");\n\nfunction onStart(){\n  drawCircle(50,50,20)\n  write("Hallo 😀",50,50)\n}';
      }
      const lint = linter((view) => {
        let errors=[];
        if(this.errors){
          let e=this.errors;
          errors.push({
            from: e.from,
            to: e.to,
            severity: "error",
            message: e.message
          });
        }
        return errors;
      });
      editor=new EditorView({
        state: EditorState.create({
          doc: "",
          extensions: [
            basicSetup,
            //highlightActiveLine(),
            breakpointGutter,
            EditorView.lineWrapping,
            lint,
            keymap.of(toggleComment),
            lintGutter(),
            wordHover,
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
                  let lintPlugin=editor.plugins[12];
                  if(lintPlugin && lintPlugin.value && lintPlugin.value.lintTime){
                    lintPlugin.value.run()
                  }
                  changed=false;
                }
              }, 500 );
            }),
          ]
        }),
        parent: this.$refs.editor
      });
      editor.dispatch({
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
      setCode(sourceCode){
        editor.dispatch({
          changes: {from: 0, to: this.size, insert: sourceCode}
        });
      },
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
        /*Objekt-Instanziierung*/
        for(let i=0;i<infos.clazzes.length;i++){
          let c=infos.clazzes[i];
          let ps="";
          if(c.params && c.params.length>0){
            ps=createParamsString(c.params,true);
          }
          let s=autocomplete.snippetCompletion("new "+c.name+ps, {
            label: "new "+c.name,
            info: "Erzeugt ein neues Objekt der Klasse '"+c.name+"'.",
            type: "function"
          });
          additionalCompletions.push(s);
        }
      },
      prettifyCode(){
        var code=this.$root.sourceCode;
        code=js_beautify(code,{
          "indent_size": 2,
          "max_preserve_newlines": 2,
          "indent_empty_lines": true,
          "space_in_paren": true,
          "space_in_empty_paren": true
        });
        this.$root.sourceCode=code;
        editor.dispatch({
          changes: {from: 0, to: this.size, insert: code}
        });
        this.check();
      },
      setFontSize(fs){
        this.fontSize=fs;
        
      },
      openSearchPanel(){
        openSearchPanel(editor);
        this.isSearchPanelOpen=true;
      },
      closeSearchPanel(){
        closeSearchPanel(editor);
        this.isSearchPanelOpen=false;
      },
      toggleSearchPanel(){
        if(this.isSearchPanelOpen){
          this.closeSearchPanel();
        }else{
          this.openSearchPanel();
        }
      },
      lineAt(pos){
        return this.state.doc.lineAt(pos);
      },
      reset: function(sourceCode){
        this.runtimeError=[];
        this.$root.sourceCode=sourceCode;
        editor.dispatch({
          changes: {from: 0, to: this.size, insert: this.$root.sourceCode}
        });
        this.check();
      },
      undo(){
        undo({state: editor.viewState.state, dispatch: editor.dispatch});
      },
      redo(){
        redo({state: editor.viewState.state, dispatch: editor.dispatch});
      },
      setRuntimeError: function(error){
        this.runtimeError.pop();
        if(error){
          this.errorID++;
          this.runtimeError.push(error);
        }
      },
      insert(text){
        let pos=editor.state.selection.ranges[0].from;
        editor.dispatch({
          changes: {from: pos, to: pos, insert: text}
        });
        editor.focus();
      },
      setCursor: function(position){
        //editor.focus();
        editor.dispatch({
          selection: new EditorSelection([EditorSelection.cursor(position)], 0),
          scrollIntoView: true
        });
      },
      setCursorToLine: function(linenumber){
        let line=this.getLineByNumber(linenumber);
        this.setCursor(line.from);
      },
      getLineByNumber: function(linenumber){
        return editor.state.doc.line(linenumber);
      },
      setSelection(anchor,head){
        editor.dispatch({
          selection: {anchor, head},
          scrollIntoView: true
        })
      },
      focus(){
        editor.focus();
      },
      async check(debugging){
        let src=this.$root.sourceCode;
        let time1=new Date();
        let infos=await parse(src,this.state.tree,{debugging: debugging, dontParseGlobalVariables: !this.autocompleteVariables},this.state);
        let time2=new Date();
        console.info("Parsing completed in "+(time2-time1)+"ms",infos);
        this.$root.sourceCodeDebugging=infos.code;
        this.$emit("parse",infos);
        if(infos.error){
          this.errors=infos.error.message;
          return;
        }
        let p=new Promise((resolve,reject)=>{
          try{
            let ast=acorn.parse(src, {ecmaVersion: 2020});
            resolve(false);
          }catch(e){
            resolve(e);
          }
        }).then((errors)=>{
          if(errors){
            let line=this.getLineByNumber(errors.loc.line);
            this.errors={
              isError: true,
              message: errors.message,
              from: line.from,
              to: line.to
            };

            // let t="Zeile "+errors.loc.line+": ";
            // if(errors.message.startsWith("Unexpected token")){
            //   if(errors.pos>=this.$root.sourceCode.length){
            //     t+="Unerwartes Ende des Codes. Fehlt eine '}'?"
            //   }else{
            //     t+="Unerwartetes Zeichen";
            //   }
              
            // }else{
            //   t+=errors.message;
            // }
            // this.errors=t;
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