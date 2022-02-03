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
    if (word.from == word.to && !context.explicit)
      return null
    return {
      from: word.from,
      options,
      span: /^[.A-Za-z$_0-9]*$/
    }
    let from=nodeBefore.from;
    if(nodeBefore.prevSibling && nodeBefore.prevSibling.name==="."){
      from=nodeBefore.prevSibling.from;
    }
    return {
      from,
      options,
      span: /^[\.\w$]*$/
    }
    if (completePropertyAfter.includes(nodeBefore.name) &&
        nodeBefore.parent?.name == "MemberExpression") {
      let object = nodeBefore.parent.getChild("Expression");
      if (object?.name == "VariableName") {
        let from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from;
        let variableName = context.state.sliceDoc(object.from, object.to);
        if (typeof window[variableName] == "object"){
          return completeProperties(from, window[variableName]);
        }
      }
    } else if (nodeBefore.name == "VariableName") {
      console.log('variable name')
      return completeProperties(nodeBefore.from, window)
    } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
      console.log("nichts")
      return completeProperties(context.pos, window)
    }
    return null
  };
}

function completeProperties(from, object) {
  let options = []
  for (let name in object) {
    options.push({
      label: name,
      type: typeof object[name] == "function" ? "function" : "variable"
    })
  }
  return {
    from,
    options,
    span: /^[\w$]*$/
  }
}

function replaceHTML(html){
  let t=html;
  t=t.replace(/<\/?code>/g,"");
  t=t.replace(/<\/?a[^>]*>/g,"");
  return t;
}

export function createParamsString(params,useArgs){
  let t=[];
  if(params){
    for(let i=0;i<params.length;i++){
      let p=params[i];
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

  
  snippets.topLevel.push(autocomplete.snippetCompletion("function ${name}( ) {\n\t${}\n}", {
    label: "function",
    info: "Definiert eine neue Funktion.",
    type: "keyword"
  }));
  
  array.push(autocomplete.snippetCompletion("for (let ${i} = 0; ${i} < ${max}; ${i}++) {\n\t${}\n}", {
      label: "for",
      info: "Eine for-Schleife wiederholt ihren Inhalt mehrere Male.",
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

let data={"functions":[{"name":"alert","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht.","details":"","isNative":true,"level":"everywhere"},{"name":"clear","returnType":null,"args":[],"info":"LÃ¶scht den Inhalt der ZeichenflÃ¤che.","details":"Verwende diesen Befehl zu Beginn der Funktion <a href=\"#help-onNextFrame\"><code>onNextFrame</code></a>, damit du danach alles neu zeichnen kannst.","isNative":false},{"name":"confirm","returnType":"boolean","args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht. Der Benutzer muss zwischen OK und Abbrechen wÃ¤hlen. Die Auswahl wird als <code>true</code> oder <code>false</code> zurÃ¼ckgegeben.","details":"","isNative":true,"level":"everywhere"},{"name":"distance","returnType":"double","args":[{"name":"x1","type":"double","info":"x-Koordinate des ersten Punktes"},{"name":"y1","type":"double","info":"y-Koordinate des ersten Punktes"},{"name":"x2","type":"double","info":"x-Koordinate des zweiten Punktes"},{"name":"y2","type":"double","info":"y-Koordinate des zweiten Punktes"}],"info":"Berechnet den Abstand der beiden Punkte (<code>x1</code>|<code>y1</code>) und (<code>x2</code>|<code>y2</code>) mit Hilfe des Satz des Pythagoras.","details":"Verwende diesen Befehl, um festzustellen, ob zwei Dinge kollidieren.<code><pre>if(distance(x,y,gegnerX,gegnerY) < 10){\n\t//Kollision\n}</pre></code>","isNative":false,"level":"everywhere"},{"name":"drawCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen Kreis und gibt diesen zurÃ¼ck","details":"","isNative":false},{"name":"drawImage","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll."}],"info":"Zeichnet ein Bild. Dieses musst du vorher mittels loadAsset laden.","details":"","isNative":false},{"name":"drawImagePart","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."},{"name":"scx","type":"double","info":"x-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"scy","type":"double","info":"y-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"width","type":"double","info":"Breite des Ausschnittes."},{"name":"height","type":"double","info":"HÃ¶he des Ausschnittes."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll."},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll."}],"info":"Zeichnet einen rechteckigen Ausschnitt eines Bildes. Dieses musst du vorher mittels \"loadAsset\" laden.","details":"","isNative":false},{"name":"drawLine","returnType":"Path","args":[{"name":"x1","type":"double","info":"x-Koordinate des ersten Punkts."},{"name":"y1","type":"double","info":"y-Koordinate des ersten Punkts."},{"name":"x2","type":"double","info":"x-Koordinate des zweiten Punkts."},{"name":"y2","type":"double","info":"y-Koordinate des zweiten Punkts."}],"info":"Zeichnet eine gerade Linie von (x1|y1) bis (x2|y2)","details":"Wenn du eine ganze Figur zeichnen willst, ist es oft besser, einen mittels <a href=\"#help-path\">path</a> einen Pfad zu zeichnen.","isNative":false},{"name":"drawRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."}],"info":"Zeichnet ein Rechteck und gibt dieses zurÃ¼ck.","details":"","isNative":false},{"name":"fillCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen ausgefÃ¼llten Kreis und gibt diesen zurÃ¼ck.","details":"","isNative":false},{"name":"fillRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."}],"info":"Zeichnet ein ausgefÃ¼lltes Rechteck und gibt dieses zurÃ¼ck.","details":"","isNative":false},{"name":"hideHelp","returnType":null,"args":[],"info":"Versteckt den Hilfe-Button oben rechts.","details":"","isNative":false,"level":"everywhere"},{"name":"isKeyDown","returnType":"boolean","args":[{"name":"key","type":"String","info":"Das Zeichen, von dem geprÃ¼ft werden soll, ob die zugehÃ¶rige Taste gedrÃ¼ckt wird; bspw. \"W\", \" \" oder \"4\"."}],"info":"PrÃ¼ft, ob eine bestimmte Taste auf der Tastatur gedrÃ¼ckt wird.","details":"","isNative":false},{"name":"loadAsset","returnType":null,"args":[{"name":"url","type":"String","info":"URL der Datei"},{"name":"name","type":"String","info":"Name, unter dem das Asset gespeichert wird."}],"info":"LÃ¤dt ein sog. \"Asset\" (ein Bild oder ein Sound) und speichert es unter dem angegebenen Namen im Objekt \"assets\". Muss vor onStart aufgerufen werden.","details":"","isNative":false,"level":"topLevel"},{"name":"prompt","returnType":"String","args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht und  einem Eingabefeld. Liefert den eingegebenen Text zurÃ¼ck.","details":"","isNative":true,"level":"everywhere"},{"name":"promptNumber","returnType":"double","args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."}],"info":"Zeigt eine Messagebox mit einer Nachricht und einem Eingabefeld. Liefert die eingegebene Zahl zurÃ¼ck.","details":"","isNative":false,"level":"everywhere"},{"name":"random","returnType":"int","args":[{"name":"min","type":"int","info":"Mindestwert fÃ¼r die Zufallszahl."},{"name":"max","type":"int","info":"Maximalwert fÃ¼r die Zufallszahl."}],"info":"Liefert eine ganze Zufallszahl zwischen <code>min</code> und <code>max</code> (jeweils einschlieÃŸlich).","details":"","isNative":false,"level":"everywhere"},{"name":"restoreCanvasState","returnType":null,"args":[],"info":"Stellt den zuletzt gespeicherten Zustand des Canvas wieder her.","details":"","isNative":false},{"name":"rotate","returnType":null,"args":[{"name":"angle","type":"double","info":"Winkel, um den gedreht wird"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts der Drehung."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts der Drehung."}],"info":"Dreht alles, was danach gezeichnet wird.","details":"","isNative":false},{"name":"saveCanvasState","returnType":null,"args":[],"info":"Speichert den aktuellen Zustand des Canvas auf einem Stack.","details":"","isNative":false},{"name":"scale","returnType":null,"args":[{"name":"sx","type":"double","info":"Skalierungsfaktor in x-Richtung. Bei negativem Wert wird an einer vertikalen Achse gespiegelt."},{"name":"sy","type":"double","info":"Skalierungsfaktor in y-Richtung. Bei negativem Wert wird an einer horizontalen Achse gespiegelt."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts der Skalierung."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts der Skalierung."}],"info":"Skaliert alles, was danach gezeichnet wird.","details":"","isNative":false},{"name":"setColor","returnType":null,"args":[{"name":"color","type":"String","info":"Farbe, die ab sofort zum Zeichnen und FÃ¼llen verwendet werden soll. Kann eine beliebige Bezeichnung fÃ¼r eine HTML-Farbe sein, z. B. <code>\"red\"</code>, <code>\"blue\"</code> oder <code>\"#e307A6\"</code>. Diese Bezeichnungen findest du bspw. unter <a href=\"https://htmlcolorcodes.com/\" target=\"_blank\">htmlcolorcodes</a>."}],"info":"Legt die Farbe fÃ¼r alle nachfolgenden Zeichnungen fest.","details":"","isNative":false},{"name":"setFont","returnType":null,"args":[{"name":"name","type":"String","info":"Schriftart, z. B. Arial."}],"info":"Legt die Schriftart fÃ¼r alle nachfolgenden write-Befehle fest.","details":"","isNative":false},{"name":"setFontsize","returnType":null,"args":[{"name":"size","type":"double","info":"SchriftgrÃ¶ÃŸe, die ab sofort zum Schreiben verwendet werden soll."}],"info":"Legt die SchriftgrÃ¶ÃŸe fÃ¼r alle nachfolgenden write-Befehle fest.","details":"","isNative":false},{"name":"setLinewidth","returnType":null,"args":[{"name":"size","type":"double","info":"Die Dicke der Linien, die ab sofort verwendet werden soll."}],"info":"Legt die Breite der Linien fÃ¼r alle nachfolgenden Zeichnungen fest.","details":"","isNative":false},{"name":"setOpacity","returnType":null,"args":[{"name":"value","type":"double","info":"Wert zwischen 0 (komplett transparent) und 1 (komplett sichtbar)."}],"info":"Legt die Transparenz alle nachfolgenden Zeichnungen fest.","details":"","isNative":false},{"name":"setupApp","returnType":null,"args":[{"name":"title","type":"String","info":"Der Name der App, der im Browser-Tab angezeigt wird."},{"name":"favicon","type":"String","info":"Ein beliebiges Unicode-Symbol, das als Icon fÃ¼r die App verwendet wird. Du findest viele Unicode-Symbole, wenn du direkt nach z. B. \"unicode drache\" googelst oder unter <a href=\"https://www.compart.com/de/unicode/\" target=\"_blank\">compart.com/de/unicode</a>."},{"name":"width","type":"int","info":"Die Breite der App."},{"name":"height","type":"int","info":"Die HÃ¶he der App."},{"name":"backgroundColor","type":"String","info":"Die Hintergrundfarbe der App."}],"info":"Legt die Grundeigenschaften der App fest: Den Titel, das Icon, die Breite und die HÃ¶he sowie die Hintergrundfarbe.","details":"Verwende diesen Befehl zu Beginn der <code>onStart</code>-Funktion.<code><pre>onStart(){\n\tsetupApp(\"Meine App\",\"ðŸš€\",100,100,\"black\");\n\t//weitere Befehle\n}</pre></code><p></p>","isNative":false,"level":true},{"name":"showHelp","returnType":null,"args":[],"info":"Zeigt den Hilfe-Button oben rechts wieder an.","details":"","isNative":false,"level":"everywhere"},{"name":"sound","returnType":null,"args":[{"name":"asset","type":"String","info":"URL des Sounds, der abgespielt werden soll."}],"info":"Spielt einen Sound ab. Dieser muss vorher mit loadAssets geladen werden.","details":"","isNative":false},{"name":"toast","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der angezeigt werden soll."},{"name":"position","type":"String","info":"Optional: Eine Angabe aus bis zu 2 WÃ¶rtern, die bestimmen, wo der Text erscheinen soll. MÃ¶gliche WÃ¶rter: <code>\"left\"</code>, <code>\"center\"</code>, <code>\"right\"</code> und <code>\"top\"</code>, <code>\"middle\"</code>, <code>\"bottom\"</code>."},{"name":"duration","type":"int","info":"Optional: Die Dauer der Anzeige in Millisekunden."}],"info":"Zeigt eine Nachricht fÃ¼r einen gewissen Zeitraum an.","details":"","isNative":false},{"name":"translate","returnType":null,"args":[{"name":"dx","type":"double","info":"Verschiebung in x-Richtung."},{"name":"dy","type":"double","info":"Verschiebung in y-Richtung."}],"info":"Verschiebt alles, was danach gezeichnet wird.","details":"","isNative":false},{"name":"write","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der geschrieben werden soll. Verwende <code>&bsol;n</code> fÃ¼r ZeilenumbrÃ¼che."},{"name":"x","type":"double","info":"Die x-Koordinate des Texts."},{"name":"y","type":"double","info":"Die y-Koordinate des Texts."},{"name":"align","type":"String","info":"Eine Angabe aus bis zu 2 WÃ¶rtern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. MÃ¶gliche WÃ¶rter: <code>\"left\"</code>, <code>\"center\"</code>, <code>\"right\"</code> und <code>\"top\"</code>, <code>\"middle\"</code>, <code>\"bottom\"</code>."}],"info":"Schreibt Text auf den Bildschirm.","details":"","isNative":false}],"objects":[{"name":"mouse","info":"Liefert dir Informationen Ã¼ber den Mauszeiger / den Finger (bei Touchscreens).","members":[{"name":"x","type":"double","info":"Die aktuelle x-Koordinate der Maus."},{"name":"y","type":"double","info":"Die aktuelle y-Koordinate der Maus."},{"name":"down","type":"boolean","info":"Ist gerade die Maustaste gedrÃ¼ckt / berÃ¼hrt der Finger gerade den Bildschirm?"},{"name":"inRect","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts des Rechtecks"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts des Rechtecks"},{"name":"width","type":"double","info":"Breite des Rechtecks"},{"name":"cx","type":"double","info":"HÃ¶he des Rechtecks"}],"info":"PrÃ¼ft, ob sich die Maus aktuell innerhalb des Rechtecks mit Mittelpunkt (cx|cy) und Breite width und HÃ¶he height befindet."},{"name":"inCircle","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts des Kreises"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts des Kreises"},{"name":"r","type":"double","info":"Radius des Kreises"}],"info":"PrÃ¼ft, ob sich die Maus aktuell innerhalb des Kreises mit Mittelpunkt (cx|cy) und Radius r befindet."}]},{"name":"time","info":"Liefert dir Informationen Ã¼ber die Zeit und erlaubt es dir, Timer zu stellen und zu stoppen.","members":[{"name":"now","info":"Die aktuelle Zeit in Millisekunden seit dem 1.1.1970.","type":"int"},{"name":"sec","info":"Die Sekundenzahl der aktuellen Uhrzeit.","type":"int"},{"name":"min","type":"int","info":"Die Minutenzahl der aktuellen Uhrzeit."},{"name":"h","type":"int","info":"Die Stundenzahl der aktuellen Uhrzeit."},{"name":"day","type":"int","info":"Der aktuelle Tag im Monat."},{"name":"month","type":"int","info":"Der aktuelle Monat (1-12)."},{"name":"year","type":"int","info":"Die aktuelle Jahreszahl."},{"name":"start","returnType":null,"args":[{"name":"millis","type":"int","info":"Anzahl Millisekunden bis der Timer auslÃ¶st."},{"name":"name","type":"String","info":"Name des Timers, mit dem onTimeout aufgerufen wird."}],"info":"Startet einen Timer, der millis Millisekunden lang lÃ¤uft. Wenn er ablÃ¤uft, lÃ¶st er die Funktion <code>onTimeout</code> aus."},{"name":"stop","returnType":null,"args":[{"name":"name","type":"String","info":"Name des Timers, der gestoppt werden soll."}],"info":"Stoppt den Timer mit dem angegebenen Namen. Wenn du keinen Namen angibst, werden alle laufenden Timer gestoppt."},{"name":"year","type":"int","info":"Die aktuelle Jahreszahl (vierstellig)."}],"details":"everywhere"},{"name":"gamepad","info":"Erlaubt die Benutzung des Gamepads.","members":[{"name":"show","returnType":null,"info":"Zeigt das Gamepad an."},{"name":"hide","returnType":null,"info":"Verbirgt das Gamepad."},{"name":"left","type":"boolean","info":"Wird gerade der Joystick nach links bewegt?"},{"name":"setLeft","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Links\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Links\" verbunden werden soll."},{"name":"right","type":"boolean","info":"Wird gerade der Joystick nach rechts bewegt?"},{"name":"setRight","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Rechts\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Rechts\" verbunden werden soll."},{"name":"up","type":"boolean","info":"Wird gerade der Joystick nach oben bewegt?"},{"name":"setUp","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Oben\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Oben\" verbunden werden soll."},{"name":"down","type":"boolean","info":"Wird gerade der Joystick nach unten bewegt?"},{"name":"setDown","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Unten\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Steuerkreuz - Unten\" verbunden werden soll."},{"name":"A","type":"boolean","info":"Wird gerade die Taste \"A\" gedrÃ¼ckt?"},{"name":"setA","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"A\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"A\" verbunden werden soll."},{"name":"B","type":"boolean","info":"Wird gerade die Taste \"B\" gedrÃ¼ckt?"},{"name":"setB","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"B\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"B\" verbunden werden soll."},{"name":"X","type":"boolean","info":"Wird gerade die Taste \"X\" gedrÃ¼ckt?"},{"name":"setX","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"X\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"X\" verbunden werden soll."},{"name":"Y","type":"boolean","info":"Wird gerade die Taste \"Y\" gedrÃ¼ckt?"},{"name":"setY","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"Y\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"Y\" verbunden werden soll."},{"name":"E","type":"boolean","info":"Wird gerade die Taste \"E\" gedrÃ¼ckt?"},{"name":"setE","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"E\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"E\" verbunden werden soll."},{"name":"F","type":"boolean","info":"Wird gerade die Taste \"F\" gedrÃ¼ckt?"},{"name":"setF","language":"java","returnType":null,"args":[{"name":"keycode","type":"int","info":"Keycode der Taste, die mit \"F\" verbunden werden soll."}],"info":"Legt fest, welche Taste auf der Tastatur mit \"F\" verbunden werden soll."}],"details":"Durch Zuweisen eines Zeichens zu einer Taste kannst du festlegen, welche Taste zu welchem Button gehoert:<code><pre>function onStart(){\n\tgamepad.show();\n\t//Bewegung mit WASD:\n\tgamepad.up = \"W\";\n\tgamepad.down = \"S\";\n\tgamepad.left = \"A\";\n\tgamepad.right = \"D\";\n\t//Buttons E und F ausblenden:\n\tgamepad.E = null;\n\tgamepad.F = null;\n\t//Button B durch Leertaste:\n\tgamepad.B = \" \";\n}</pre></code>"},{"name":"path","info":"Erlaubt das Zeichnen von Figuren und Linien.","members":[{"name":"begin","returnType":"Path","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"Beginnt einen neuen Pfad am Punkt (<code>x</code>|<code>y</code>)"},{"name":"jump","returnType":"Path","args":[{"name":"dx","type":"double","info":"Unterschied in x-Richtung"},{"name":"dy","type":"double","info":"Unterschied in y-Richtung"}],"info":"Springt von der aktuellen Position um <code>dx</code> nach rechts und um <code>dy</code> nach oben, ohne etwas zu zeichnen."},{"name":"jumpTo","returnType":"Path","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"Springt von der aktuellen Position zum Punkt (<code>x</code>|<code>y</code>), ohne etwas zu zeichnen."},{"name":"line","returnType":"Path","args":[{"name":"dx","type":"double","info":"Unterschied in x-Richtung"},{"name":"dy","type":"double","info":"Unterschied in y-Richtung"}],"info":"Zeichnet eine gerade Linie von der aktuellen Position um <code>dx</code> nach rechts und um <code>dy</code> nach oben."},{"name":"close","returnType":"Path","info":"Zeichnet eine gerade Linie vom aktuellen Punkt zurÃ¼ck zum Startpunkt des Pfades."},{"name":"draw","returnType":"Path","info":"Zeichnet den Pfad."},{"name":"fill","returnType":"Path","info":"FÃ¼llt den Pfad."},{"name":"contains","returnType":"boolean","args":[{"name":"x","type":"double","info":"x-Koordinate"},{"name":"y","type":"double","info":"y-Koordinate"}],"info":"PrÃ¼ft, ob sich der Punkt (<code>x</code>|<code>y</code>) innerhalb des aktuellen Pfades befindet."},{"name":"rect","returnType":"Path","args":[{"name":"w","type":"double","info":"Breite"},{"name":"h","type":"double","info":"HÃ¶he"}],"info":"Zeichnet ein Rechteck mit dem aktuellen Punkt als Mittelpunkt und Breite w und HÃ¶he h."},{"name":"circle(r,[start,stop])","returnType":"Path","args":[{"name":"r","type":"double","info":"Radius"},{"name":"start","type":"double","info":"Startwinkel"},{"name":"stop","type":"double","info":"Endwinkel"}],"info":"Zeichnet einen Kreisbogen mit dem aktuellen Punkt als Mittelpunkt Radius <code>r</code>. Optional kannst du mit <code>start</code> und <code>stop</code> den Anfangs- und den Endwinkel festlegen, um nur einen Teil des Kreises zu zeichnen."}],"details":""},{"name":"ui","info":"Erlaubt das HinzufÃ¼gen und Manipulieren der grafischen BenutzeroberflÃ¤che (UI).","members":[{"name":"button","returnType":"JButton","args":[{"name":"text","type":"String","info":"Aufschrift des Buttons"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."},{"name":"height","type":"double","info":"HÃ¶he. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."}],"info":"Erzeugt einen neuen Button mit der Aufschrift <code>text</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der HÃ¶he <code>height</code>. Liefert den Button zurÃ¼ck."},{"name":"input","language":"js","returnType":"Input","args":[{"name":"text","type":"String","info":"Art des Inputs"},{"name":"placeholdertext","type":"String","info":"Text, der angezeigt wird, wenn das Element leer ist."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."},{"name":"height","type":"double","info":"HÃ¶he. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."}],"info":"Erzeugt ein neues Eingabefeld, in das der User etwas eingeben kann. Mit <code>type</code> legst du fest, was der User eingeben soll (normalerweise <code>\"text\"</code> oder <code>\"number\"</code>, es gibt aber <a href=\"https://www.w3schools.com/html/html_form_input_types.asp\" target=\"_blank\">noch viel mehr</a>). Du kannst auÃŸerdem den Platzhaltertext <code>placeholdertext</code>, den Mittelpunkt (<code>cx</code>|<code>cy</code>), die Breite <code>width</code> und die HÃ¶he <code>height</code> festlegen. Liefert das Eingabefeld zurÃ¼ck."},{"name":"textfield","language":"java","returnType":"JTextField","args":[{"name":"placeholdertext","type":"String","info":"Text, der angezeigt wird, wenn das Element leer ist."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."},{"name":"height","type":"double","info":"HÃ¶he. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."}],"info":"Erzeugt ein neues Eingabefeld, in das der User Text eingeben kann. Du kannst den Platzhaltertext <code>placeholdertext</code>, den Mittelpunkt (<code>cx</code>|<code>cy</code>), die Breite <code>width</code> und die HÃ¶he <code>height</code> festlegen. Liefert das Element zurÃ¼ck."},{"name":"textarea","returnType":"JTextArea","args":[{"name":"placeholdertext","type":"String","info":"Text, der angezeigt wird, wenn das Element leer ist."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."},{"name":"height","type":"double","info":"HÃ¶he. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."}],"info":"Erzeugt eine neue TextArea mit dem Platzhaltertext <code>placeholdertext</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der HÃ¶he <code>height</code>. Liefert die TextArea zurÃ¼ck."},{"name":"select","returnType":"JCombobox","args":[{"name":"options","type":"String[]","info":"Optionen, die zur Auswahl stehen"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."},{"name":"height","type":"double","info":"HÃ¶he. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."}],"info":"Erzeugt ein neues Select-Element mit den Auswahl-Optionen <code>options</code> (ein  Array), dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der HÃ¶he <code>height</code>. Liefert das Select-Element zurÃ¼ck."},{"name":"label","returnType":"JLabel","args":[{"name":"text","type":"String","info":"Art des Inputs"},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts"},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts"},{"name":"width","type":"double","info":"Breite. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."},{"name":"height","type":"double","info":"HÃ¶he. Bei einem negativen Wert wird das Element in seiner natÃ¼rlichen GrÃ¶ÃŸe gezeichnet."}],"info":"Erzeugt ein neues Label mit dem Inhalt <code>text</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der HÃ¶he <code>height</code>. Liefert das Label zurÃ¼ck."}],"details":""},{"name":"world","info":"Erlaubt es, eine zweidimensionale Spielwelt zu verwenden, die aus einzelnen quadratischen Feldern (sog. \"Tiles\" = \"Fliesen\") besteht.","members":[{"name":"setup","returnType":null,"args":[{"name":"description","type":"String","info":"Dieser Text definiert die Felder der Spielwelt: Jede Zeile definiert eine Zeile der Spielwelt."}],"info":"Definiert die Felder (Tiles) der Spielwelt."},{"name":"getType","returnType":"String","args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"}],"info":"Gibt den Typ (das Zeichen) an der angegebenen Position zurÃ¼ck. Falls es an der Position kein eindeutiges Zeichen gibt, wird null zurÃ¼ckgegeben."},{"name":"setType","returnType":null,"args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"},{"name":"newType","type":"String","info":"Neuer Typ"}],"info":"Ã„ndert den Typ (das Zeichen) an der angegebenen Position."},{"name":"getInfo","returnType":"String","args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"}],"info":"Gibt die Information an der angegebenen Position zurÃ¼ck."},{"name":"setInfo","returnType":null,"args":[{"name":"x","type":"double","info":"x-Koordinate in der Welt"},{"name":"y","type":"double","info":"y-Koordinate in der Welt"},{"name":"newInfo","type":"String","info":"Neuer Typ"}],"info":"Ã„ndert die Information an der angegebenen Position."},{"name":"create","returnType":null,"args":[{"name":"width","type":"int","info":"Anzahl Felder nebeneinander"},{"name":"height","type":"int","info":"Anzahl Felder untereinander"}],"info":"Erschafft eine neue Spielwelt der angegebenen GrÃ¶ÃŸe. Alle Typen werden auf \" \" gesetzt."},{"name":"addRow","returnType":null,"args":[{"name":"description","type":"String","info":"Dieser Text definiert die Felder der neuen Zeile."}],"info":"FÃ¼gt der Spielwelt eine neue Zeile hinzu."},{"name":"replaceTypes","returnType":null,"args":[{"name":"oldType","type":"String","info":"Felder mit diesem Typ erhalten den neuen Typ."},{"name":"newType","type":"String","info":"Der neue Typ, den die Felder erhalten."}],"info":"Ã„ndert den Typ von allen Felder eines bestimmten Typs."},{"name":"draw","returnType":null,"args":[],"info":"Zeichnet die Welt. Implementiere die Funktion \"onTileDraw\", um zu festzulegen, wie die Felder gezeichnet werden sollen."},{"name":"scroll","returnType":null,"args":[{"name":"cx","type":"double","info":"x-Koordinate, zu der gescrollt wird"},{"name":"cy","type":"double","info":"y-Koordinate, zu der gescrollt wird"}],"info":"Verschiebt die Welt so, dass der angegebene Punkt im Mittelpunkt des Bildschirms liegt."},{"name":"scrollBy","returnType":null,"args":[{"name":"dx","type":"double","info":"Scroll-Weite in x-Richtung"},{"name":"dy","type":"double","info":"Scroll-Weite in y-Richtung"}],"info":"Verschiebt die Welt um die angegebenen Zahlen."},{"name":"zoom","returnType":null,"args":[{"name":"factor","type":"double","info":"Die StÃ¤rke des Zoomens: 1 fÃ¼r Einpassung der Welt in den Bildschirm."}],"info":"Legt fest, wie weit in die Welt hinein- bzw. herausgezoomt wird."},{"name":"write","returnType":null,"args":[{"name":"text","type":"String","info":"Der Text, der geschrieben werden soll. Verwende <code>&bsol;n</code> fÃ¼r ZeilenumbrÃ¼che."},{"name":"x","type":"double","info":"Die x-Koordinate des Texts."},{"name":"y","type":"double","info":"Die y-Koordinate des Texts."},{"name":"align","type":"String","info":"Eine Angabe aus bis zu 2 WÃ¶rtern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. MÃ¶gliche WÃ¶rter: <code>\"left\"</code>, <code>\"center\"</code>, <code>\"right\"</code> und <code>\"top\"</code>, <code>\"middle\"</code>, <code>\"bottom\"</code>."}],"info":"Schreibt Text in die Spielwelt."},{"name":"drawRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."}],"info":"Zeichnet ein Rechteck in die Spielwelt und gibt dieses zurÃ¼ck."},{"name":"fillRect","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."}],"info":"Zeichnet ein ausgefÃ¼lltes Rechteck in die Spielwelt und gibt dieses zurÃ¼ck."},{"name":"drawCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen Kreis in die Spielwelt und gibt dieses zurÃ¼ck."},{"name":"fillCircle","returnType":"Path","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"Zeichnet einen ausgefÃ¼llten Kreis in die Spielwelt und gibt dieses zurÃ¼ck."},{"name":"drawImage","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll."},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll."}],"info":"Zeichnet ein Bild in die Spielwelt. Dieses musst du vorher mittels \"loadAsset\" laden."},{"name":"drawImagePart","returnType":null,"args":[{"name":"image","type":"String","info":"Bild-Asset. Muss vorher mittels <a href=\"#help-loadAsset\"><code>loadAsset</code></a> geladen werden."},{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."},{"name":"scx","type":"double","info":"x-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"scy","type":"double","info":"y-Koordinate des Mittelpunkts des Ausschnittes."},{"name":"width","type":"double","info":"Breite des Ausschnittes."},{"name":"height","type":"double","info":"HÃ¶he des Ausschnittes."},{"name":"rotation","type":"double","info":"Winkel, um den das Bild gedreht werden soll."},{"name":"mirrored","type":"boolean","info":"true, wenn das Bild vertikal gespiegelt werden soll."}],"info":"Zeichnet einen rechteckigen Ausschnitt eines Bild in die Spielwelt. Dieses musst du vorher mittels \"loadAsset\" laden."},{"name":"mouseX","info":"Die aktuelle x-Koordinate der Maus innerhalb der Spielwelt."},{"name":"mouseY","info":"Die aktuelle y-Koordinate der Maus innerhalb der Spielwelt."},{"name":"mouseDown","info":"Ist die Maus aktuell gedrÃ¼ckt oder nicht (entspricht mouse.down)."},{"name":"mouseInRect","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"width","type":"double","info":"Breite."},{"name":"height","type":"double","info":"HÃ¶he."}],"info":"PrÃ¼ft, ob sich die Maus aktuell innerhalb eines Rechtecks in der Spielwelt befindet."},{"name":"mouseInCircle","returnType":"boolean","args":[{"name":"cx","type":"double","info":"x-Koordinate des Mittelpunkts."},{"name":"cy","type":"double","info":"y-Koordinate des Mittelpunkts."},{"name":"r","type":"double","info":"Radius."}],"info":"PrÃ¼ft, ob sich die Maus aktuell innerhalb eines Kreises in der Spielwelt befindet."}],"details":""},{"name":"console","info":"Erlaubt die Benutzung der Konsole.","members":[{"name":"log","returnType":null,"args":[{"name":"text","type":"String","info":"Text, der ausgegeben werden soll."}],"info":"Gibt den <code>text</code> in der Konsole aus."},{"name":"show","returnType":null,"info":"Zeigt die Konsole an."},{"name":"hide()","returnType":null,"info":"Verbirgt die Konsole."}],"details":"","level":"everywhere"}],"eventHandlers":[{"name":"onStart","args":[],"info":"Wird einmalig ausgefÃ¼hrt, wenn das Programm startet.","details":""},{"name":"onTileDraw","args":[{"name":"x","type":"double","info":"x-Koordinate des Mittelpunkts des Feldes."},{"name":"y","type":"double","info":"y-Koordinate des Mittelpunkts des Feldes."},{"name":"type","type":"String","info":"Typ des Feldes (das Zeichen)."},{"name":"info","type":"String","info":"Information des Feldes."}],"info":"Wird fÃ¼r jedes Feld der Spielwelt ausgefÃ¼hrt, wenn diese gezeichnet wird.","details":""},{"name":"onNextFrame","args":[],"info":"Wird ca. 60 mal pro Sekunde ausgefÃ¼hrt.","details":""},{"name":"onKeyDown","args":[{"name":"keycode","type":"int","info":"Der Code der gedrÃ¼ckten Taste, z. B. 65 fÃ¼r \"A\" oder 32 fÃ¼r die Leertaste."}],"info":"Wird ausgefÃ¼hrt, wenn eine Taste auf der Tastatur gedrÃ¼ckt wird. ACHTUNG: Funktioniert nicht bei GerÃ¤ten ohne Tastatur! Verwende lieber das <a href=\"#help-gamepad\">Gamepad</a>.","details":""},{"name":"onKeyUp","args":[{"name":"keycode","type":"int","info":"Der Code der losgelassenen Taste, z. B. 65 fÃ¼r \"A\" oder 32 fÃ¼r die Leertaste."}],"info":"Wird ausgefÃ¼hrt, wenn eine Taste auf der Tastatur losgelassen wird. ACHTUNG: Funktioniert nicht bei GerÃ¤ten ohne Tastatur! Verwende lieber das <a href=\"#help-gamepad\">Gamepad</a>.","details":""},{"name":"onMouseDown","args":[],"info":"Wird ausgefÃ¼hrt, wenn der Benutzer eine Maustaste drÃ¼ckt oder mit dem Finger den Touchscreen berÃ¼hrt.","details":""},{"name":"onMouseMove","args":[],"info":"Wird ausgefÃ¼hrt, wenn der Benutzer die Maus bewegt oder mit dem Finger Ã¼ber den Touchscreen streicht.","details":""},{"name":"onMouseUp","args":[],"info":"Wird ausgefÃ¼hrt, wenn der Benutzer die Maustaste loslÃ¤sst oder die BerÃ¼hrung des Touchscreens mit dem Finger beendet.","details":""},{"name":"onGamepadDown","args":[{"name":"button","type":"String","info":"Der Name des Buttons, der gedrÃ¼ckt wurde, also z. B. \"A\" oder \"Y\" oder \"left\"."}],"info":"Wird ausgefÃ¼hrt, wenn der Benutzer einen Teil des Gamepads berÃ¼hrt oder die zugeordnete Taste auf der Tastatur drÃ¼ckt.","details":""},{"name":"onGamepadUp","args":[{"name":"button","type":"String","info":"Der Name des Buttons, der losgelassen wurde, also z. B. \"A\" oder \"Y\" oder \"left\"."}],"info":"Wird ausgefÃ¼hrt, wenn der Benutzer die BerÃ¼hrung des Gamepads beendet oder aufhÃ¶rt, die zugeordnete Taste auf der Tastatur zu drÃ¼cken.","details":""},{"name":"onTimeout","args":[{"name":"name","type":"String","info":"Der Name des Timers, der abgelaufen ist."}],"info":"Wird ausgefÃ¼hrt, wenn ein Timer ablÃ¤uft. Du kannst mit time.start einen Timer starten.","details":""},{"name":"onAction","args":[{"name":"trigger","type":"JComponent","info":"Das Element, das das Ereignis ausgeloest hat."}],"info":"Wird ausgefÃ¼hrt, wenn der User mit einem UI-Element interagiert (z. B. auf einen Button klickt).","details":""}]};

export const snippets=createSnippets(data);