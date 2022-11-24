import  * as autocomplete  from "@codemirror/autocomplete";
import {syntaxTree} from "@codemirror/language"

const completePropertyAfter = ["PropertyName", ".", "?."]
const dontCompleteIn = ["TemplateString", "LineComment", "BlockComment",
                        "VariableDefinition", "PropertyDefinition"]

export function createAutocompletion(additional){
  return (context)=>{
    let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
    //innerhalb einer funktion?
    let inFunction=false;
    let n=nodeBefore;
    while(n){
      if(n.type.name==="FunctionDeclaration"){
        inFunction=true;
        break;
      }
      n=n.parent;
    }
    let options=snippets.everywhere;
    if(inFunction){
      options=options.concat(snippets.inFunction);
    }else{
      options=options.concat(snippets.topLevel);
    }
    options=options.concat(additional);
    let word = context.matchBefore(/[.A-Za-z$_0-9]*/)
    if (word.from == word.to && !context.explicit){
      return null;
    }
    let showObjectOnly=false;
    let line=context.state.doc.lineAt(context.pos)
    let posInLine=context.pos-line.from;
    let posOfWordInLine=word.from-line.from;
    line=line.text;
    posInLine=posOfWordInLine-1;
    while(posInLine>0 && /\s/.test(line.charAt(posInLine))){
      posInLine--;
    }
    if(posInLine>2){
      let wordBefore=line.substring(posInLine-2,posInLine+1);
      if(wordBefore==="new" && (posInLine===3 ||/\W/.test(line.charAt(posInLine-3)))){
        options.push(autocomplete.snippetCompletion("Object", {
          label: "Object",
          info: "Ein Objekt fasst mehrere Variablen zusammen.",
          type: "keyword"
        }));
        showObjectOnly=true;
      }
    }
    if(!showObjectOnly){
      options.push(autocomplete.snippetCompletion("new Object", {
        label: "new Object",
        info: "Erzeugt ein neues Objekt.",
        type: "keyword"
      }));
    }
    //let ws=context.matchBefore(/\s+/)
    return {
      from: word.from,
      options,
      span: /^[.A-Za-z$_0-9]*$/
    }
  };
}

function replaceHTML(html){
  let t=html;
  if(t){
    t=t.replace(/<\/?code>/g,"");
    t=t.replace(/<\/?a[^>]*>/g,"");
  }
  return t;
}

export function createParamsString(params,useArgs){
  let t=[];
  if(params){
    for(let i=0;i<params.length;i++){
      let p=params[i];
      if(p.hide){
        continue;
      }
      let text;
      if(p.substring){
        text=p;
      }else{
        text=p.name;
      }
      if(useArgs){
        text="${"+text+"}";
      }
      t.push(text);
    }
  }
  return "("+t.join(", ")+")";
}

function createSnippets(data){
  let snippets={
    everywhere: [],
    topLevel: [],
    inFunction: []
  }
  for(let ev in data.eventHandlers){
    ev=data.eventHandlers[ev];
    snippets.topLevel.push(autocomplete.snippetCompletion("function "+ev.name+createParamsString(ev.args)+"{\n\t${}\n}", {
      label: "function "+ev.name,
      info: replaceHTML(ev.info),
      type: "eventhandler"
    }));
  }
  

  for(let ev in data.functions){
    ev=data.functions[ev];
    let array = ev.level==="everywhere"? snippets.everywhere : (ev.level==="topLevel"? snippets.topLevel : snippets.inFunction);
    array.push(autocomplete.snippetCompletion(ev.name+createParamsString(ev.args,true), {
      label: ev.name+"(...)",//+createParamsString(ev.args),
      info: replaceHTML(ev.info),
      type: "function"
    }));
  }

  for(let o in data.objects){
    o=data.objects[o];
    let array = o.level==="everywhere"? snippets.everywhere : (o.level==="topLevel"? snippets.topLevel : snippets.inFunction);
    array.push(autocomplete.snippetCompletion(o.name, {
      label: o.name,
      info: replaceHTML(o.info),
      type: "variable"
    }));
    for(let m in o.members){
      m=o.members[m];
      if(m.returnType===undefined){
        array.push(autocomplete.snippetCompletion(o.name+"."+m.name, {
          label: o.name+"."+m.name,
          info: replaceHTML(m.info),
          type: "variable"
        }));
      }else{
        array.push(autocomplete.snippetCompletion(o.name+"."+m.name+createParamsString(m.args,true), {
          label: o.name+"."+m.name+"(...)",//createParamsString(m.args),
          info: replaceHTML(m.info),
          type: "function"
        }));
      }
    }
  }
  
  let array=snippets.everywhere;

  array.push({
    apply: "Math", 
    label: "Math",
    info: "Enthält eine Vielzahl mathematischer Funktionen und Konstanten.",
    type: "object"
  });

  array.push(autocomplete.snippetCompletion("Math.round(${x})", {
    label: "Math.round",
    info: "Rundet die Zahl auf Ganze.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.floor(${x})", {
    label: "Math.floor",
    info: "Rundet die Zahl auf Ganze ab.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.ceil(${x})", {
    label: "Math.ceil",
    info: "Rundet die Zahl auf Ganze auf.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.sin(${x})", {
    label: "Math.sin",
    info: "Berechnet den Sinus der Zahl im Bogenmaß.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.cos(${x})", {
    label: "Math.cos",
    info: "Berechnet den Kosinus der Zahl im Bogenmaß.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.tan(${x})", {
    label: "Math.tan",
    info: "Berechnet den Tangens der Zahl im Bogenmaß.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.asin(${x})", {
    label: "Math.asin",
    info: "Berechnet den Arcus-Sinus der Zahl im Bogenmaß.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.acos(${x})", {
    label: "Math.acos",
    info: "Berechnet den Arcus-Kosinus der Zahl im Bogenmaß.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.atan(${x})", {
    label: "Math.atan",
    info: "Berechnet den Arcus-Tangens der Zahl im Bogenmaß.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.sqrt(${x})", {
    label: "Math.sqrt",
    info: "Berechnet die Wurzel aus der Zahl.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.pow(${basis},${exp})", {
    label: "Math.pow",
    info: "Berechnet basis hoch exp.",
    type: "function"
  }));

  array.push(autocomplete.snippetCompletion("Math.PI", {
    label: "Math.PI",
    info: "Die Kreiszahl PI = 3.1415...",
    type: "variable"
  }));

  array.push(autocomplete.snippetCompletion("Math.E", {
    label: "Math.E",
    info: "Die eulersche Zahl e = 2.718...",
    type: "variable"
  }));

  let unicode="😀😁😆😈😉😌😍😎😐😒😖😘😡😢😧😩😭😱"
  array.push(autocomplete.snippetCompletion("//"+unicode, {
    label: "unicode smileys",
    info: "Fügt eine Auswahl von Unicode-Smileys ein: "+unicode,
    type: "macro"
  }));

  unicode="🐝🕷🕸️😾👸👹👻👼👽👾👿⛄💀💃🧚🧛🧜🧝🧞🐅🦄🐕🦇🐉🦖🐬🐟";
  array.push(autocomplete.snippetCompletion("//"+unicode, {
    label: "unicode kreaturen",
    info: "Fügt eine Auswahl von Unicode-Kreaturen ein: "+unicode,
    type: "macro"
  }));

  unicode="🕸️🌸💮🏵️🌺🌹🌻🌼🌷🌲🌴🌵🌿🍀🍄☁️⛅🌤️🌧️🌨️🌩️🌪️🔥❄️💧🎄";
  array.push(autocomplete.snippetCompletion("//"+unicode, {
    label: "unicode natur",
    info: "Fügt eine Auswahl von Unicode-Symbolen zum Thema Natur ein: "+unicode,
    type: "macro"
  }));

  unicode="🚀🚁🚂🚃🚍🚑🚒🚓🚔🚘🚜🚢✈";
  array.push(autocomplete.snippetCompletion("//"+unicode, {
    label: "unicode fahrzeuge",
    info: "Fügt eine Auswahl von Unicode-Fahrzeugen ein: "+unicode,
    type: "macro"
  }));

  unicode="❤🔥⛰️💥💫✨✔️👍⚡";
  array.push(autocomplete.snippetCompletion("//"+unicode, {
    label: "unicode symbole",
    info: "Fügt eine Auswahl von Unicode-Symbolen ein: "+unicode,
    type: "macro"
  }));

  snippets.topLevel.push(autocomplete.snippetCompletion("function ${name}( ) {\n\t${}\n}", {
    label: "function",
    info: "Definiert eine neue Funktion.",
    type: "keyword"
  }));

  snippets.topLevel.push(autocomplete.snippetCompletion("class ${name} { ${} }", {
    label: "class",
    info: "Definiert eine neue Klasse.",
    type: "keyword"
  }));
  
  array.push(autocomplete.snippetCompletion("for ( ${obj} of ${array} ) {\n\t${}\n}", {
    label: "for-array",
    boost: 10,
    info: "Eine for-of-Schleife führt ihren Code für jedes Element eines Arrays aus.",
    type: "keyword"
}));

  array.push(autocomplete.snippetCompletion("for (let ${i} = 0; ${i} < ${max}; ${i}++) {\n\t${}\n}", {
      label: "for-index",
      info: "Eine normale for-Schleife wiederholt ihren Inhalt mehrere Male.",
      type: "keyword"
  }));

  array.push(autocomplete.snippetCompletion("if (${bedingung}) {\n\t${}\n}", {
    label: "if",
    info: "Die Anweisungen werden nur dann ausgeführt, wenn die Bedingung erfüllt ist.",
    type: "keyword"
  }));

  array.push(autocomplete.snippetCompletion("if (${bedingung}) {\n\t${}\n}else{\n\t${}\n}", {
    label: "ifelse",
    info: "Die ersten Anweisungen werden nur dann ausgeführt, wenn die Bedingung erfüllt ist, ansonsten die zweiten.",
    type: "keyword"
  }));

  return snippets;
}

let data={"functions":[{"name":"alert","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht.","details":"","isNative":false,"level":"everywhere"},{"name":"clear","returnType":null,"args":[],"info":"Loescht den Inhalt der Zeichenflaeche.","details":"Verwende diesen Befehl zu Beginn der Funktion <a href=\"#help-onNextFrame\"><code>onNextFrame</code></a>, damit du danach alles neu zeichnen kannst.","isNative":false},{"name":"confirm","returnType":"boolean","args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht. Der Benutzer muss zwischen OK und Abbrechen waehlen. Die Auswahl wird als <code>true</code> oder <code>false</code> zurueckgegeben.","details":"","isNative":false,"level":"everywhere"},{"name":"distance","returnType":"double","args":[{"name":"x1","type":"double","info":"x-Koordinate des ersten Punktes"},{"name":"y1","type":"double","info":"y-Koordinate des ersten Punktes"},{"name":"x2","type":"double","info":"x-Koordinate des zweiten Punktes"},{"name":"y2","type":"double","info":"y-Koordinate des zweiten Punktes"}],"info":"Berechnet den Abstand der beiden Punkte (<code>x1</code>|<code>y1</code>) und (<code>x2</code>|<code>y2</code>) mit Hilfe des Satz des Pythagoras.","details":"Verwende diesen Befehl, um festzustellen, ob zwei Dinge kollidieren.<code><pre>if(distance(x,y,gegnerX,gegnerY) < 10){\n\t//Kollision\n}</pre></code>","isNative":false,"level":"everywhere"},{"name":"drawCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen Kreis und gibt diesen zurueck","details":"","isNative":false},{"name":"drawImage","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll.","hide":true},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll.","hide":true}],"info":"Zeichnet ein Bild. Dieses musst du vorher mittels loadAsset laden.","details":"","isNative":false},{"name":"drawImagePart","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."},{"name":"scx","type":"double","info":"x-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"scy","type":"double","info":"y-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"width","type":"double","info":"Breite des Ausschnittes."},{"name":"height","type":"double","info":"Hoehe des Ausschnittes."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll.","hide":true},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll.","hide":true}],"info":"Zeichnet einen rechteckigen Ausschnitt eines Bildes. Dieses musst du vorher mittels \"loadAsset\" laden.","details":"","isNative":false},{"name":"drawLine","returnType":"Path","args":[{"name":"x1","type":"double","info":"x-Koordinate des ersten Punkts."},{"name":"y1","type":"double","info":"y-Koordinate des ersten Punkts."},{"name":"x2","type":"double","info":"x-Koordinate des zweiten Punkts."},{"name":"y2","type":"double","info":"y-Koordinate des zweiten Punkts."}],"info":"Zeichnet eine gerade Linie von (x1|y1) bis (x2|y2)","details":"Wenn du eine ganze Figur zeichnen willst, ist es oft besser, einen mittels <a href=\"#help-path\">path</a> einen Pfad zu zeichnen.","isNative":false},{"name":"drawRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."}],"info":"Zeichnet ein Rechteck und gibt dieses zurueck.","details":"","isNative":false},{"name":"fillCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen ausgefuellten Kreis und gibt diesen zurueck.","details":"","isNative":false},{"name":"fillOutside","returnType":null,"args":[],"info":"Fuellt alle Bereiche, die auerhalb des Koordinatensystems liegen, mit der aktuellen Farbe.","details":"","isNative":false},{"name":"fillRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."}],"info":"Zeichnet ein ausgefuelltes Rechteck und gibt dieses zurueck.","details":"","isNative":false},{"name":"getHeight","returnType":"double","args":[],"info":"Liefert die aktuelle Hoehe des Bildschirms in Pixeln.","details":"","isNative":false},{"name":"getMaxX","returnType":"double","args":[],"info":"Liefert den groessten x-Wert, der aktuell noch sichtbar ist.","details":"","isNative":false},{"name":"getMaxY","returnType":"double","args":[],"info":"Liefert den groessten y-Wert, der aktuell noch sichtbar ist.","details":"","isNative":false},{"name":"getMinX","returnType":"double","args":[],"info":"Liefert den kleinsten x-Wert, der aktuell noch sichtbar ist.","details":"","isNative":false},{"name":"getMinY","returnType":"double","args":[],"info":"Liefert den kleinsten y-Wert, der aktuell noch sichtbar ist.","details":"","isNative":false},{"name":"getWidth","returnType":"double","args":[],"info":"Liefert die aktuelle Breite des Bildschirms in Pixeln.","details":"","isNative":false},{"name":"hideHelp","returnType":null,"args":[],"info":"Versteckt den Hilfe-Button oben rechts.","details":"","isNative":false,"level":"everywhere"},{"name":"isKeyDown","returnType":"boolean","args":[{"name":"key","type":"String","info":"Das Zeichen, von dem geprueft werden soll, ob die zugehoerige Taste gedrueckt wird; bspw. \"W\", \" \" oder \"4\"."}],"info":"Prueft, ob eine bestimmte Taste auf der Tastatur gedrueckt wird.","details":"","isNative":false},{"name":"loadAsset","returnType":null,"args":[{"name":"url","type":"String","info":"URL der Datei"},{"name":"name","type":"String","info":"Name, unter dem das Asset gespeichert wird."}],"info":"Laedt ein sog. \"Asset\" (ein Bild oder ein Sound) und speichert es unter dem angegebenen Namen im Objekt \"assets\". Muss vor onStart aufgerufen werden.","details":"","isNative":false,"level":"topLevel"},{"name":"loadHowlerJS","returnType":null,"args":[],"info":"Laedt HowlerJS, was du zum Abspielen von Sounds brauchst. Muss vor onStart aufgerufen werden.","details":"","isNative":false,"level":"topLevel"},{"name":"loadPeerJS","returnType":null,"args":[],"info":"Laedt PeerJS, was du zur Verbindungsherstellung über das Internet brauchst. Muss vor onStart aufgerufen werden.","details":"","isNative":false,"level":"topLevel"},{"name":"loadScript","returnType":null,"args":[{"name":"url","type":"String","info":"URL des Scripts"}],"info":"Laedt ein JavaScript. Muss vor onStart aufgerufen werden.","details":"","isNative":false,"level":"topLevel"},{"name":"playSound","returnType":null,"args":[{"name":"soundName","type":"String","info":"Name des Sounds, der abgespielt werden soll."},{"name":"loop","type":"boolean","info":"true, wenn der Sound in Dauerschleife gespielt werden soll."}],"info":"Spielt den Sound mit dem angegebenen Namen ab.","details":"","isNative":false},{"name":"prompt","returnType":"String","args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht und  einem Eingabefeld. Liefert den eingegebenen Text zurueck.","details":"","isNative":false,"level":"everywhere"},{"name":"promptNumber","returnType":"double","args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht und einem Eingabefeld. Liefert die eingegebene Zahl zurueck.","details":"","isNative":false,"level":"everywhere"},{"name":"random","returnType":"int","args":[{"name":"min","type":"int","info":"Mindestwert fuer die Zufallszahl."},{"name":"max","type":"int","info":"Maximalwert fuer die Zufallszahl."}],"info":"Liefert eine ganze Zufallszahl zwischen <code>min</code> und <code>max</code> (jeweils einschliesslich).","details":"","isNative":false,"level":"everywhere"},{"name":"range","returnType":{"baseType":"int","dimension":1},"args":[{"name":"start","type":"int","info":"Erste Zahl","hide":true},{"name":"stop","type":"int","info":"Letzte Zahl"},{"name":"step","type":"int","info":"Schritt zwischen zwei Zahlen","hide":true}],"info":"Generiert ein Array mit den Zahlen von min bis max. Kann z. B. in for-Schleifen verwendet werden.","details":"","isNative":false,"level":"everywhere"},{"name":"restoreCanvasState","returnType":null,"args":[],"info":"Stellt den zuletzt gespeicherten Zustand des Canvas wieder her.","details":"","isNative":false},{"name":"rotate","returnType":null,"args":[{"name":"angle","type":"double","info":"Winkel, um den gedreht wird"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts der Drehung."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts der Drehung."}],"info":"Dreht alles, was danach gezeichnet wird.","details":"","isNative":false},{"name":"saveCanvasState","returnType":null,"args":[],"info":"Speichert den aktuellen Zustand des Canvas auf einem Stack.","details":"","isNative":false},{"name":"scale","returnType":null,"args":[{"name":"sx","type":"double","info":"Skalierungsfaktor in x-Richtung. Bei negativem Wert wird an einer vertikalen Achse gespiegelt."},{"name":"sy","type":"double","info":"Skalierungsfaktor in y-Richtung. Bei negativem Wert wird an einer horizontalen Achse gespiegelt."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts der Skalierung."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts der Skalierung."}],"info":"Skaliert alles, was danach gezeichnet wird.","details":"","isNative":false},{"name":"setColor","returnType":null,"args":[{"name":"color","type":"String","info":"Farbe, die ab sofort zum Zeichnen und Fuellen verwendet werden soll. Kann eine beliebige Bezeichnung fuer eine HTML-Farbe sein, z. B. <code>\"red\"</code>, <code>\"blue\"</code> oder <code>\"#e307A6\"</code>. Diese Bezeichnungen findest du bspw. unter <a href=\"https://htmlcolorcodes.com/\" target=\"_blank\">htmlcolorcodes</a>."}],"info":"Legt die Farbe fuer alle nachfolgenden Zeichnungen fest.","details":"","isNative":false},{"name":"setCoordinatesystem","returnType":null,"args":[{"name":"width","type":"double","info":"Breite des Koordinatensystems"},{"name":"height","type":"double","info":"Hoehe des Koordinatensystems"},{"name":"originX","type":"double","info":"x-Koordinate des Koordinatenursprungs","optional":true},{"name":"originY","type":"double","info":"y-Koordinate des Koordinatenursprungs"}],"info":"Legt das Koordiantensystem der App fest.","details":"","isNative":false},{"name":"setFont","returnType":null,"args":[{"name":"name","type":"String","info":"Schriftart, z. B. Arial."}],"info":"Legt die Schriftart fuer alle nachfolgenden write-Befehle fest.","details":"","isNative":false},{"name":"setFontsize","returnType":null,"args":[{"name":"size","type":"double","info":"Schriftgroesse, die ab sofort zum Schreiben verwendet werden soll."}],"info":"Legt die Schriftgroesse fuer alle nachfolgenden write-Befehle fest.","details":"","isNative":false},{"name":"setLinewidth","returnType":null,"args":[{"name":"size","type":"double","info":"Die Dicke der Linien, die ab sofort verwendet werden soll."}],"info":"Legt die Breite der Linien fuer alle nachfolgenden Zeichnungen fest.","details":"","isNative":false},{"name":"setMirrored","returnType":null,"args":[{"name":"m","type":"boolean","info":"Wenn true, dann wird der Text aller nachfolgenden write-Befehle vertikal gespiegelt. Wenn false, wird der Text wieder normal geschrieben."}],"info":"Legt fuer alle nachfolgenden write-Befehle fest, ob der Text gespiegelt werden soll.","details":"","isNative":false},{"name":"setOpacity","returnType":null,"args":[{"name":"value","type":"double","info":"Wert zwischen 0 (komplett transparent) und 1 (komplett sichtbar)."}],"info":"Legt die Transparenz alle nachfolgenden Zeichnungen fest.","details":"","isNative":false},{"name":"setRotation","returnType":null,"args":[{"name":"angle","type":"double","info":"Der Winkel um den gedreht werden soll. 0 entspricht keiner Drehung. Es wird gegen den Uhrzeigersinn gedreht."}],"info":"Legt die Drehung fuer alle nachfolgenden write-Befehle fest.","details":"","isNative":false},{"name":"setupApp","returnType":null,"args":[{"name":"title","type":"String","info":"Der Name der App, der im Browser-Tab angezeigt wird."},{"name":"favicon","type":"String","info":"Ein beliebiges Unicode-Symbol, das als Icon fuer die App verwendet wird. Du findest viele Unicode-Symbole, wenn du direkt nach z. B. \"unicode drache\" googelst oder unter <a href=\"https://www.compart.com/de/unicode/\" target=\"_blank\">compart.com/de/unicode</a>."},{"name":"width","type":"int","info":"Die Breite der App."},{"name":"height","type":"int","info":"Die Hoehe der App."},{"name":"backgroundColor","type":"String","info":"Die Hintergrundfarbe der App."}],"info":"Legt die Grundeigenschaften der App fest: Den Titel, das Icon, die Breite und die Hoehe sowie die Hintergrundfarbe.","details":"Verwende diesen Befehl zu Beginn der <code>onStart</code>-Funktion.<code><pre>onStart(){\n\tsetupApp(\"Meine App\",\"ðŸš€\",100,100,\"black\");\n\t//weitere Befehle\n}</pre></code><p></p>","isNative":false,"level":true},{"name":"showHelp","returnType":null,"args":[],"info":"Zeigt den Hilfe-Button oben rechts wieder an.","details":"","isNative":false,"level":"everywhere"},{"name":"sleep","returnType":null,"args":[{"name":"millis","type":"int","info":"Anzahl Millisekunden, die das Programm abwarten soll."}],"info":"Unterbricht den Programmablauf fuer eine gewisse Zeit.","details":"Dieser Befehl funktioniert nur zusammen mit async/await.","isNative":false},{"name":"stopSound","returnType":null,"args":[{"name":"soundName","type":"String","info":"Name des Sounds, der gestoppt werden soll. null, wenn alle Sound gestoppt werden sollen."}],"info":"Spielt den Sound mit dem angegebenen Namen ab.","details":"","isNative":false},{"name":"toast","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."},{"name":"position","type":"String","info":"Optional: Eine Angabe aus bis zu 2 Woertern, die bestimmen, wo der Text erscheinen soll. Moegliche Woerter: <code>\"left\"</code>, <code>\"center\"</code>, <code>\"right\"</code> und <code>\"top\"</code>, <code>\"middle\"</code>, <code>\"bottom\"</code>."},{"name":"duration","type":"int","info":"Optional: Die Dauer der Anzeige in Millisekunden."}],"info":"Zeigt eine Nachricht fuer einen gewissen Zeitraum an.","details":"","isNative":false},{"name":"translate","returnType":null,"args":[{"name":"dx","type":"double","info":"Verschiebung in x-Richtung."},{"name":"dy","type":"double","info":"Verschiebung in y-Richtung."}],"info":"Verschiebt alles, was danach gezeichnet wird.","details":"","isNative":false},{"name":"write","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der geschrieben werden soll. Verwende <code>&bsol;n</code> fuer Zeilenumbrueche."},{"name":"x","type":"double","info":"Die x-Koordinate des Texts."},{"name":"y","type":"double","info":"Die y-Koordinate des Texts."},{"name":"align","type":"String","info":"Eine Angabe aus bis zu 2 Woertern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. Moegliche Woerter: <code>\"left\"</code>, <code>\"center\"</code>, <code>\"right\"</code> und <code>\"top\"</code>, <code>\"middle\"</code>, <code>\"bottom\"</code>.","hide":true}],"info":"Schreibt Text auf den Bildschirm.","details":"","isNative":false}],"objects":[{"name":"session","info":"Hiermit kannst du eine Netzwerksession aufsetzen, in der sich mehrere Instanzen deiner App miteinander verbinden können.","members":[{"name":"myID","type":"String","info":"Die ID, mit der du aktuell im Netzwerk angemeldet ist."},{"name":"isServer","type":"boolean","info":"true, wenn du selbst der Server bist, ansonsten false."},{"name":"sessionID","type":"String","info":"Die ID der Session, mit der diese App verbunden ist."},{"name":"showStartDialog","returnType":null,"args":[],"info":"Zeigt einen Dialog, mit dem man bequem eine Netzwerksession starten kann."},{"name":"start","returnType":null,"args":[{"name":"sessionID","type":"String","info":"ID deiner Netzwerksession"},{"name":"clientID","type":"String","info":"Dein Name im Netzwerk."},{"name":"isHost","type":"boolean","info":"Legt fest, ob du der Host (Server) bist oder ein Client, der dem Serer beitritt."}],"info":"Startet eine neue Netzwerksession entweder als Host oder als Client."},{"name":"sendMessage","returnType":null,"args":[{"name":"message","type":"String","info":"Nachricht, die versendet wird."}],"info":"Sendet eine Nachricht an alle Teilnehmer der Netzwerksession."}]},{"name":"mouse","info":"Liefert dir Informationen ueber den Mauszeiger / den Finger (bei Touchscreens).","members":[{"name":"x","type":"double","info":"Die aktuelle x-Koordinate der Maus."},{"name":"y","type":"double","info":"Die aktuelle y-Koordinate der Maus."},{"name":"down","type":"boolean","info":"Ist gerade die Maustaste gedrueckt / beruehrt der Finger gerade den Bildschirm?"},{"name":"inRect","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts des Rechtecks"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts des Rechtecks"},{"name":"width","type":"double","info":"Breite des Rechtecks"},{"name":"cx","type":"double","info":"Hoehe des Rechtecks"}],"info":"Prueft, ob sich die Maus aktuell innerhalb des Rechtecks mit Mittelpunkt (cx|cy) und Breite width und Hoehe height befindet."},{"name":"inCircle","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts des Kreises"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts des Kreises"},{"name":"r","type":"double","info":"Radius des Kreises"}],"info":"Prueft, ob sich die Maus aktuell innerhalb des Kreises mit Mittelpunkt (cx|cy) und Radius r befindet."}]},{"name":"storage","info":"Erlaubt das Speichern und Laden von Daten.","members":[{"name":"keys","type":{"baseType":"double","dimension":1},"info":"Ein String-Array mit allen Keys, die von der App verwendet werden."},{"name":"save","returnType":"boolean","args":[{"name":"key","type":"String","info":"Key, unter dem der Wert gespeichert werden soll."},{"name":"value","type":"String","info":"Wert, der gespeichert werden soll"}],"info":"Speichert den Wert value unter einem Key key im lokalen Speicher des Browsers. Liefert true zurück, wenn der Vorgang erfolgreich war, ansonsten false (z.B. weil kein Speicherplatz mehr verfügbar ist)."},{"name":"load","returnType":"String","args":[{"name":"key","type":"String","info":"Key, dessen Wert geladen werden soll."}],"info":"Lädt den Wert, der im lokalen Speicher des Browsers unter dem Key key gespeichert ist. Ist kein Wert vorhanden, wird null zurückgegeben."},{"name":"removeItem","returnType":null,"args":[{"name":"key","type":"String","info":"Key, dessen Wert entfernt werden soll."}],"info":"Entfernt den Wert, der im lokalen Speicher des Browsers unter dem Key key gespeichert ist. Ist kein Wert vorhanden, bewirkt diese Methode nichts."},{"name":"removeAllItems","returnType":null,"args":[],"info":"Löscht den kompletten Inhalt des lokalen Speichers des Browsers."},{"name":"download","returnType":null,"args":[{"name":"text","type":"String","info":"Inhalt der Datei, die heruntergeladen werden soll."},{"name":"filename","type":"String","info":"Name der Datei, die heruntergeladen werden soll."}],"info":"Erzeugt eine Datei, die der User auf seinem:ihrem Gerät speichern kann."},{"name":"upload","returnType":"File","args":[],"info":"Erlaubt es dem User eine Datei von seinem:ihrem Gerät hochzuladen und liefert die Datei zurück."}]},{"name":"time","info":"Liefert dir Informationen ueber die Zeit und erlaubt es dir, Timer zu stellen und zu stoppen.","members":[{"name":"now","info":"Die aktuelle Zeit in Millisekunden seit dem 1.1.1970.","type":"int"},{"name":"sec","info":"Die Sekundenzahl der aktuellen Uhrzeit.","type":"int"},{"name":"min","type":"int","info":"Die Minutenzahl der aktuellen Uhrzeit."},{"name":"h","type":"int","info":"Die Stundenzahl der aktuellen Uhrzeit."},{"name":"day","type":"int","info":"Der aktuelle Tag im Monat."},{"name":"month","type":"int","info":"Der aktuelle Monat (1-12)."},{"name":"year","type":"int","info":"Die aktuelle Jahreszahl."},{"name":"start","returnType":null,"args":[{"name":"millis","type":"int","info":"Anzahl Millisekunden bis der Timer ausloest."},{"name":"name","type":"String","info":"Name des Timers, mit dem onTimeout aufgerufen wird."}],"info":"Startet einen Timer, der millis Millisekunden lang laeuft. Wenn er ablaeuft, loest er die Funktion <code>onTimeout</code> aus."},{"name":"stop","returnType":null,"args":[{"name":"name","type":"String","info":"Name des Timers, der gestoppt werden soll."}],"info":"Stoppt den Timer mit dem angegebenen Namen. Wenn du keinen Namen angibst, werden alle laufenden Timer gestoppt."},{"name":"year","type":"int","info":"Die aktuelle Jahreszahl (vierstellig)."}],"details":"everywhere"},{"name":"gamepad","info":"Erlaubt die Benutzung des Gamepads.","members":[{"name":"show","returnType":null,"info":"Zeigt das Gamepad an."},{"name":"hide","returnType":null,"info":"Verbirgt das Gamepad."},{"name":"left","type":"boolean","info":"Wird gerade der Joystick nach links bewegt?"},{"name":"setLeft","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Links\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Links\" verbunden werden soll."},{"name":"right","type":"boolean","info":"Wird gerade der Joystick nach rechts bewegt?"},{"name":"setRight","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Rechts\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Rechts\" verbunden werden soll."},{"name":"up","type":"boolean","info":"Wird gerade der Joystick nach oben bewegt?"},{"name":"setUp","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Oben\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Oben\" verbunden werden soll."},{"name":"down","type":"boolean","info":"Wird gerade der Joystick nach unten bewegt?"},{"name":"setDown","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Unten\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Unten\" verbunden werden soll."},{"name":"A","type":"boolean","info":"Wird gerade die Taste \"A\" gedrueckt?"},{"name":"setA","language":"java","returnType":null,"args":[{"name":"taste","type":"String","info":"Name der Taste, die mit \"A\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"A\" verbunden werden soll."},{"name":"B","type":"boolean","info":"Wird gerade die Taste \"B\" gedrueckt?"},{"name":"setB","language":"java","returnType":null,"args":[{"name":"taste","type":"String","info":"Name der Taste, die mit \"B\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"B\" verbunden werden soll."},{"name":"X","type":"boolean","info":"Wird gerade die Taste \"X\" gedrueckt?"},{"name":"setX","language":"java","returnType":null,"args":[{"name":"taste","type":"String","info":"Name der Taste, die mit \"X\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"X\" verbunden werden soll."},{"name":"Y","type":"boolean","info":"Wird gerade die Taste \"Y\" gedrueckt?"},{"name":"setY","language":"java","returnType":null,"args":[{"name":"taste","type":"String","info":"Name der Taste, die mit \"Y\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Y\" verbunden werden soll."},{"name":"E","type":"boolean","info":"Wird gerade die Taste \"E\" gedrueckt?"},{"name":"setE","language":"java","returnType":null,"args":[{"name":"taste","type":"String","info":"Name der Taste, die mit \"E\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"E\" verbunden werden soll."},{"name":"F","type":"boolean","info":"Wird gerade die Taste \"F\" gedrueckt?"},{"name":"setF","language":"java","returnType":null,"args":[{"name":"taste","type":"String","info":"Name der Taste, die mit \"F\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"F\" verbunden werden soll."}],"details":"Durch Zuweisen eines Zeichens zu einer Taste kannst du festlegen, welche Taste zu welchem Button gehoert:<code><pre>function onStart(){\n\tgamepad.show();\n\t//Bewegung mit WASD:\n\tgamepad.up = \"W\";\n\tgamepad.down = \"S\";\n\tgamepad.left = \"A\";\n\tgamepad.right = \"D\";\n\t//Buttons E und F ausblenden:\n\tgamepad.E = null;\n\tgamepad.F = null;\n\t//Button B durch Leertaste:\n\tgamepad.B = \" \";\n}</pre></code>"},{"name":"path","info":"Erlaubt das Zeichnen von Figuren und Linien.","members":[{"name":"begin","returnType":"Path","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"Beginnt einen neuen Pfad am Punkt (<code>x</code>|<code>y</code>)"},{"name":"jump","returnType":"Path","args":[{"name":"dx","type":"double","info":"Unterschied in x-Richtung"},{"name":"dy","type":"double","info":"Unterschied in y-Richtung"}],"info":"Springt von der aktuellen Position um <code>dx</code> nach rechts und um <code>dy</code> nach oben, ohne etwas zu zeichnen."},{"name":"jumpTo","returnType":"Path","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"Springt von der aktuellen Position zum Punkt (<code>x</code>|<code>y</code>), ohne etwas zu zeichnen."},{"name":"line","returnType":"Path","args":[{"name":"dx","type":"double","info":"Unterschied in x-Richtung"},{"name":"dy","type":"double","info":"Unterschied in y-Richtung"}],"info":"Zeichnet eine gerade Linie von der aktuellen Position um <code>dx</code> nach rechts und um <code>dy</code> nach oben."},{"name":"lineTo","returnType":"Path","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"Zeichnet eine gerade Linie von der aktuellen Position zum Punkt <code>(x|y)</code>."},{"name":"close","returnType":"Path","info":"Zeichnet eine gerade Linie vom aktuellen Punkt zurueck zum Startpunkt des Pfades."},{"name":"draw","returnType":"Path","info":"Zeichnet den Pfad."},{"name":"fill","returnType":"Path","info":"Fuellt den Pfad."},{"name":"contains","returnType":"boolean","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"Prueft, ob sich der Punkt (<code>x</code>|<code>y</code>) innerhalb des aktuellen Pfades befindet."},{"name":"rect","returnType":"Path","args":[{"name":"w","type":"double","info":"Breite"},{"name":"h","type":"double","info":"Hoehe"}],"info":"Zeichnet ein Rechteck mit dem aktuellen Punkt als Mittelpunkt und Breite w und Hoehe h."},{"name":"circle(r,[start,stop])","returnType":"Path","args":[{"name":"r","type":"double","info":"Radius"},{"name":"start","type":"double","info":"Startwinkel"},{"name":"stop","type":"double","info":"Endwinkel"}],"info":"Zeichnet einen Kreisbogen mit dem aktuellen Punkt als Mittelpunkt Radius <code>r</code>. Optional kannst du mit <code>start</code> und <code>stop</code> den Anfangs- und den Endwinkel festlegen, um nur einen Teil des Kreises zu zeichnen."}],"details":""},{"name":"ui","info":"Erlaubt das Hinzufuegen und Manipulieren der grafischen Benutzeroberflaeche (UI).","members":[{"name":"button","returnType":"JButton","args":[{"name":"text","type":"String","info":"Aufschrift des Buttons"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt einen neuen Button mit der Aufschrift <code>text</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Hoehe <code>height</code>. Liefert den Button zurueck."},{"name":"panel","returnType":"JPanel","args":[{"name":"template","type":"String","info":"Definition der Zeilen und Spalten des Panels. \"\" oder null bedeutet, dass es keine Spalten und Zeilen gibt. \"3\" bedeutet \"3 gleich breite Spalten\", \"2fr 1fr\" bedeutet \"2 Spalten, die erste doppelt so breit wie die zweite\". Hier sind alle Werte moeglich, die auch fuer die CSS-Eigenschaften \"grid-template\" oder \"grid-template-columns\" verwendet werden koennen."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt ein neues Panel, ein Container fuer andere Elemente."},{"name":"image","returnType":"JImage","args":[{"name":"url","type":"String","info":"URL zum Bild"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt ein neues Bild von der URL <code>url</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Hoehe <code>height</code>. Liefert das Bild zurueck."},{"name":"input","language":"js","returnType":"Input","args":[{"name":"text","type":"String","info":"Art des Inputs"},{"name":"placeholdertext","type":"String","info":"Text, der angezeigt wird, wenn das Element leer ist."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt ein neues Eingabefeld, in das der User etwas eingeben kann. Mit <code>type</code> legst du fest, was der User eingeben soll (normalerweise <code>\"text\"</code> oder <code>\"number\"</code>, es gibt aber <a href=\"https://www.w3schools.com/html/html_form_input_types.asp\" target=\"_blank\">noch viel mehr</a>). Du kannst ausserdem den Platzhaltertext <code>placeholdertext</code>, den Mittelpunkt (<code>cx</code>|<code>cy</code>), die Breite <code>width</code> und die Hoehe <code>height</code> festlegen. Liefert das Eingabefeld zurueck."},{"name":"datatable","language":"js","returnType":"Datatable","args":[{"name":"array","type":{"baseType":"Object","dimension":1},"info":"Array mit Objekten, die dargestellt werden sollen"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt eine neue Datatable, mit der du die Elemente eines Arrays anzeigen kannst."},{"name":"textfield","language":"java","returnType":"JTextField","args":[{"name":"placeholdertext","type":"String","info":"Text, der angezeigt wird, wenn das Element leer ist."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt ein neues Eingabefeld, in das der User Text eingeben kann. Du kannst den Platzhaltertext <code>placeholdertext</code>, den Mittelpunkt (<code>cx</code>|<code>cy</code>), die Breite <code>width</code> und die Hoehe <code>height</code> festlegen. Liefert das Element zurueck."},{"name":"textarea","returnType":"JTextArea","args":[{"name":"placeholdertext","type":"String","info":"Text, der angezeigt wird, wenn das Element leer ist."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt eine neue TextArea mit dem Platzhaltertext <code>placeholdertext</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Hoehe <code>height</code>. Liefert die TextArea zurueck."},{"name":"select","returnType":"JCombobox","args":[{"name":"options","type":"String[]","info":"Optionen, die zur Auswahl stehen"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt ein neues Select-Element mit den Auswahl-Optionen <code>options</code> (ein  Array), dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Hoehe <code>height</code>. Liefert das Select-Element zurueck."},{"name":"label","returnType":"JLabel","args":[{"name":"text","type":"String","info":"Art des Inputs"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."},{"name":"height","type":"double","info":"Hoehe. Bei einem negativen Wert wird das Element in seiner natuerlichen Groesse gezeichnet."}],"info":"Erzeugt ein neues Label mit dem Inhalt <code>text</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Hoehe <code>height</code>. Liefert das Label zurueck."}],"details":""},{"name":"world","info":"Erlaubt es, eine zweidimensionale Spielwelt zu verwenden, die aus einzelnen quadratischen Feldern (sog. \"Tiles\" = \"Fliesen\") besteht.","members":[{"name":"setup","returnType":null,"args":[{"name":"description","type":"String","info":"Dieser Text definiert die Felder der Spielwelt: Jede Zeile definiert eine Zeile der Spielwelt."}],"info":"Definiert die Felder (Tiles) der Spielwelt."},{"name":"getType","returnType":"String","args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"}],"info":"Gibt den Typ (das Zeichen) an der angegebenen Position zurueck. Falls es an der Position kein eindeutiges Zeichen gibt, wird null zurueckgegeben."},{"name":"delete","returnType":null,"info":"Loescht die aktuelle Spielwelt, damit z. B. eine neue erschaffen werden kann."},{"name":"setType","returnType":null,"args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"},{"name":"newType","type":"String","info":"Neuer Typ"}],"info":"Ã„ndert den Typ (das Zeichen) an der angegebenen Position."},{"name":"getInfo","returnType":"String","args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"}],"info":"Gibt die Information an der angegebenen Position zurueck."},{"name":"setInfo","returnType":null,"args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"},{"name":"newInfo","type":"String","info":"Neuer Typ"}],"info":"Ã„ndert die Information an der angegebenen Position."},{"name":"create","returnType":null,"args":[{"name":"width","type":"int","info":"Anzahl Felder nebeneinander"},{"name":"height","type":"int","info":"Anzahl Felder untereinander"}],"info":"Erschafft eine neue Spielwelt der angegebenen Groesse. Alle Typen werden auf \" \" gesetzt."},{"name":"addRow","returnType":null,"args":[{"name":"description","type":"String","info":"Dieser Text definiert die Felder der neuen Zeile."}],"info":"Fuegt der Spielwelt eine neue Zeile hinzu."},{"name":"replaceTypes","returnType":null,"args":[{"name":"oldType","type":"String","info":"Felder mit diesem Typ erhalten den neuen Typ."},{"name":"newType","type":"String","info":"Der neue Typ, den die Felder erhalten."}],"info":"Ã„ndert den Typ von allen Felder eines bestimmten Typs."},{"name":"draw","returnType":null,"args":[],"info":"Zeichnet die Welt. Implementiere die Funktion \"onTileDraw\", um zu festzulegen, wie die Felder gezeichnet werden sollen."},{"name":"scroll","returnType":null,"args":[{"name":"cx","type":"double","info":"x-Koordinate, zu der gescrollt wird"},{"name":"cy","type":"double","info":"y-Koordinate, zu der gescrollt wird"}],"info":"Verschiebt die Welt so, dass der angegebene Punkt im Mittelpunkt des Bildschirms liegt."},{"name":"scrollBy","returnType":null,"args":[{"name":"dx","type":"double","info":"Scroll-Weite in x-Richtung"},{"name":"dy","type":"double","info":"Scroll-Weite in y-Richtung"}],"info":"Verschiebt die Welt um die angegebenen Zahlen."},{"name":"zoom","returnType":null,"args":[{"name":"factor","type":"double","info":"Die Staerke des Zoomens: 1 fuer Einpassung der Welt in den Bildschirm."}],"info":"Legt fest, wie weit in die Welt hinein- bzw. herausgezoomt wird."},{"name":"write","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der geschrieben werden soll. Verwende <code>&bsol;n</code> fuer Zeilenumbrueche."},{"name":"x","type":"double","info":"Die x-Koordinate des Texts."},{"name":"y","type":"double","info":"Die y-Koordinate des Texts."},{"name":"align","type":"String","info":"Eine Angabe aus bis zu 2 Woertern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. Moegliche Woerter: <code>\"left\"</code>, <code>\"center\"</code>, <code>\"right\"</code> und <code>\"top\"</code>, <code>\"middle\"</code>, <code>\"bottom\"</code>.","hide":true}],"info":"Schreibt Text in die Spielwelt."},{"name":"drawRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."}],"info":"Zeichnet ein Rechteck in die Spielwelt und gibt dieses zurueck."},{"name":"fillRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."}],"info":"Zeichnet ein ausgefuelltes Rechteck in die Spielwelt und gibt dieses zurueck."},{"name":"drawCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen Kreis in die Spielwelt und gibt dieses zurueck."},{"name":"fillCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen ausgefuellten Kreis in die Spielwelt und gibt dieses zurueck."},{"name":"drawImage","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll.","hide":true},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll.","hide":true}],"info":"Zeichnet ein Bild in die Spielwelt. Dieses musst du vorher mittels \"loadAsset\" laden."},{"name":"drawImagePart","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."},{"name":"scx","type":"double","info":"x-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"scy","type":"double","info":"y-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"width","type":"double","info":"Breite des Ausschnittes."},{"name":"height","type":"double","info":"Hoehe des Ausschnittes."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll.","hide":true},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll.","hide":true}],"info":"Zeichnet einen rechteckigen Ausschnitt eines Bild in die Spielwelt. Dieses musst du vorher mittels \"loadAsset\" laden."},{"name":"mouseX","type":"double","info":"Die aktuelle x-Koordinate der Maus innerhalb der Spielwelt."},{"name":"mouseY","type":"double","info":"Die aktuelle y-Koordinate der Maus innerhalb der Spielwelt."},{"name":"mouseDown","type":"boolean","info":"Ist die Maus aktuell gedrueckt oder nicht (entspricht mouse.down)."},{"name":"mouseInRect","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"Hoehe."}],"info":"Prueft, ob sich die Maus aktuell innerhalb eines Rechtecks in der Spielwelt befindet."},{"name":"mouseInCircle","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Prueft, ob sich die Maus aktuell innerhalb eines Kreises in der Spielwelt befindet."}],"details":""},{"name":"console","info":"Erlaubt die Benutzung der Konsole.","members":[{"name":"log","returnType":null,"args":[{"name":"text","type":"String","info":"Text, der ausgegeben werden soll."}],"info":"Gibt den <code>text</code> in der Konsole aus."},{"name":"show","returnType":null,"info":"Zeigt die Konsole an."},{"name":"hide","returnType":null,"info":"Verbirgt die Konsole."}],"details":"","level":"everywhere"}],"eventHandlers":[{"name":"onStart","args":[],"info":"Wird einmalig ausgefuehrt, wenn das Programm startet.","details":""},{"name":"onResize","args":[],"info":"Wird ausgefuehrt, wenn sich die Abmessungen des Bildschirms veraendern, z. B. wenn das Fenster kleiner oder groesser gemacht wird.","details":""},{"name":"onTileDraw","args":[{"name":"x","type":"double","info":"x-Koordinate des Mittelpunkts des Feldes."},{"name":"y","type":"double","info":"y-Koordinate des Mittelpunkts des Feldes."},{"name":"type","type":"String","info":"Typ des Feldes (das Zeichen)."},{"name":"info","type":"String","info":"Information des Feldes."}],"info":"Wird fuer jedes Feld der Spielwelt ausgefuehrt, wenn diese gezeichnet wird.","details":""},{"name":"onNextFrame","args":[],"info":"Wird ca. 60 mal pro Sekunde ausgefuehrt.","details":""},{"name":"onKeyDown","args":[{"name":"keycode","type":"int","info":"Der Code der gedrueckten Taste, z. B. 65 fuer \"A\" oder 32 fuer die Leertaste."}],"info":"Wird ausgefuehrt, wenn eine Taste auf der Tastatur gedrueckt wird. ACHTUNG: Funktioniert nicht bei Geraeten ohne Tastatur! Verwende lieber das <a href=\"#help-gamepad\">Gamepad</a>.","details":""},{"name":"onKeyUp","args":[{"name":"keycode","type":"int","info":"Der Code der losgelassenen Taste, z. B. 65 fuer \"A\" oder 32 fuer die Leertaste."}],"info":"Wird ausgefuehrt, wenn eine Taste auf der Tastatur losgelassen wird. ACHTUNG: Funktioniert nicht bei Geraeten ohne Tastatur! Verwende lieber das <a href=\"#help-gamepad\">Gamepad</a>.","details":""},{"name":"onMouseDown","args":[],"info":"Wird ausgefuehrt, wenn der Benutzer eine Maustaste drueckt oder mit dem Finger den Touchscreen beruehrt.","details":""},{"name":"onMouseMove","args":[],"info":"Wird ausgefuehrt, wenn der Benutzer die Maus bewegt oder mit dem Finger ueber den Touchscreen streicht.","details":""},{"name":"onMouseUp","args":[],"info":"Wird ausgefuehrt, wenn der Benutzer die Maustaste loslaesst oder die Beruehrung des Touchscreens mit dem Finger beendet.","details":""},{"name":"onGamepadDown","args":[{"name":"button","type":"String","info":"Der Name des Buttons, der gedrueckt wurde, also z. B. \"A\" oder \"Y\" oder \"left\"."}],"info":"Wird ausgefuehrt, wenn der Benutzer einen Teil des Gamepads beruehrt oder die zugeordnete Taste auf der Tastatur drueckt.","details":""},{"name":"onGamepadUp","args":[{"name":"button","type":"String","info":"Der Name des Buttons, der losgelassen wurde, also z. B. \"A\" oder \"Y\" oder \"left\"."}],"info":"Wird ausgefuehrt, wenn der Benutzer die Beruehrung des Gamepads beendet oder aufhoert, die zugeordnete Taste auf der Tastatur zu druecken.","details":""},{"name":"onTimeout","args":[{"name":"name","type":"String","info":"Der Name des Timers, der abgelaufen ist."}],"info":"Wird ausgefuehrt, wenn ein Timer ablaeuft. Du kannst mit time.start einen Timer starten.","details":""},{"name":"onAction","args":[{"name":"trigger","type":"JComponent","info":"Das Element, das das Ereignis ausgeloest hat."}],"info":"Wird ausgefuehrt, wenn der User mit einem UI-Element interagiert (z. B. auf einen Button klickt).","details":""},{"name":"onSessionStart","args":[{"name":"isServer","type":"boolean","info":"true, wenn die Session als Server gestartet wurde, ansonsten false."}],"info":"Wird ausgefuehrt, wenn eine Netzwerk-Session gestartet wird - egal ob als Server oder als Client.","details":""},{"name":"onNewConnection","args":[{"name":"id","type":"String","info":"Die ID der neuen Verbindung."}],"info":"Wird ausgefuehrt, wenn eine neue Verbindung über das Netzwerk hergestellt wird.","details":""},{"name":"onMessage","args":[{"name":"senderID","type":"String","info":"ID des Senders"},{"name":"message","type":"String","info":"Nachricht, die empfangen wird"}],"info":"Wird ausgefuehrt, wenn die App eine Nachricht von einem anderen Client oder dem Server erhaelt.","details":""},{"name":"onSessionError","args":[{"name":"error","type":"JSON","info":"Informationen zum Fehler, der aufgetreten ist"}],"info":"Wird ausgefuehrt, wenn ein Netzwerk-Fehler auftritt, also wenn z. B. die Verbindung unterbrochen wird.","details":""}]};

export const snippets=createSnippets(data);