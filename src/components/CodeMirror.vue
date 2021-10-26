<template>
  <div id="root">
    <div id="editor" ref="editor"></div>
    <div v-if="clazz && clazz.errors" id="errors">
      <table>
        <tr v-for="(e,i) in clazz.errors" :key="'error'+i">
          <td>{{e.line.number}}:{{e.col}}:</td><td>{{e.message}} </td>
        </tr>
      </table>
    </div>
  </div>
  
</template>

<script>
  import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
  import { javascript, snippets } from "@codemirror/lang-javascript";
  import {keymap} from "@codemirror/view"
  import {indentWithTab} from "@codemirror/commands"
  import  * as autocomplete  from "@codemirror/autocomplete";
  import { indentUnit } from "@codemirror/language";

  while(snippets.length>0){
    snippets.pop();
  }
  snippets.push(autocomplete.snippetCompletion("function onStart() {\n\t${}\n}", {
    label: "function onStart",
    info: "Die Funktion onStart wird aufgerufen, wenn die App startet.",
    type: "function"
  }),);

  snippets.push(autocomplete.snippetCompletion("function onNextFrame() {\n\t${}\n}", {
    label: "function onNextFrame",
    info: "Die Funktion onNextFrame wird etwa 60 mal pro Sekunde aufgerufen.",
    type: "function"
  }),);

  snippets.push(autocomplete.snippetCompletion("function onAction(element) {\n\t${}\n}", {
    label: "function onAction",
    info: "Die Funktion onAction wird aufgerufen, wenn ein Button geklickt oder mit einem anderen UI-Element interagiert wird.",
    type: "function"
  }),);

  export default {
    props: {
      project: Object
    },
    data(){
      return {
        src: '',
        editor: null
      };
    },
    mounted(){
      let changed=false;
      let timer;
      let editor=new EditorView({
        state: EditorState.create({
          doc: 'setupApp("Name meiner App", "😀", 100, 100, "aqua");\n\nfunction onStart(){\n\tdrawCircle(50,50,10)\n}',
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
    },
    methods: {
      update(viewUpdate){
        var state=viewUpdate.state;
        var src=state.doc.toString();
        this.$root.sourceCode=src;
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