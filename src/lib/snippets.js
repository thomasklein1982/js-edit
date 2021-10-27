import  * as autocomplete  from "@codemirror/autocomplete";
  
export function prepareSnippets(snippets){
  while(snippets.length>0){
    snippets.pop();
  }
  snippets.push(autocomplete.snippetCompletion("function onStart() {\n\t${}\n}", {
    label: "function onStart",
    info: "Die Funktion onStart wird aufgerufen, wenn die App startet.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("function onNextFrame() {\n\t${}\n}", {
    label: "function onNextFrame",
    info: "Die Funktion onNextFrame wird etwa 60 mal pro Sekunde aufgerufen.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("function onAction(element) {\n\t${}\n}", {
    label: "function onAction",
    info: "Die Funktion onAction wird aufgerufen, wenn ein Button geklickt oder mit einem anderen UI-Element interagiert wird.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("alert(${text})", {
    label: "alert",
    info: "Gibt eine Nachricht in einer Messagebox aus.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("prompt(${text})", {
    label: "prompt",
    info: "Fragt den User nach einer Text-Eingabe.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("promptNumber(${text})", {
    label: "promptNumber",
    info: "Fragt den User nach einer Zahl-Eingabe.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("Math.sqrt(${x})", {
    label: "Math.sqrt",
    info: "Berechnet die Wurzel aus der Zahl.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("Math.pow(${basis},${exp})", {
    label: "Math.pow",
    info: "Berechnet basis hoch exp.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("drawCircle(${cx},${cy},${r})", {
    label: "drawCircle",
    info: "Zeichnet einen Kreis.",
    type: "function"
  }));

  snippets.push(autocomplete.snippetCompletion("function ${name}(${params}) {\n\t${}\n}", {
    label: "function",
    info: "Definiert eine neue Funktion.",
    type: "keyword"
  }));
  
  snippets.push(autocomplete.snippetCompletion("for (let ${i} = 0; ${i} < ${max}; ${i}++) {\n\t${}\n}", {
      label: "for",
      info: "Eine for-Schleife wiederholt ihren Inhalt mehrere Male.",
      type: "keyword"
  }));

  snippets.push(autocomplete.snippetCompletion("if (${bedingung}) {\n\t${}\n}", {
    label: "if",
    info: "Die Anweisungen werden nur dann ausgeführt, wenn die Bedingung erfüllt ist.",
    type: "keyword"
  }));

  snippets.push(autocomplete.snippetCompletion("if (${bedingung}) {\n\t${}\n}else{\n\t${}\n}", {
    label: "ifelse",
    info: "Die ersten Anweisungen werden nur dann ausgeführt, wenn die Bedingung erfüllt ist, ansonsten die zweiten.",
    type: "keyword"
  }));
}