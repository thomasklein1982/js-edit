export const parse=async function(src,tree,options){
  let p=new Promise(function(resolve,reject){
    let infos={
      outline: [],
      variables: null,
      codeDebugging: null,
      error: null
    };
    let parsingInfos={
      lastPos: 0,
      firstFunctionFound: false,
      usedNames: {}
    };
    let code='(async function(){try{';
    let codeFuncEnd="}catch(e){$App.handleException(e);}})(); ";
    let node=tree.topNode.firstChild;
    try{
      /**wrappe allen Code, der vor der ersten Funktion / ersten Klasse auftaucht, in eine funktion und fuehre diese direkt aus */
      while(node){
        code+=extractLineBreaks(src,node,parsingInfos);
        if(node.type.name==="FunctionDeclaration"){
          if(!parsingInfos.firstFunctionFound){
            parsingInfos.firstFunctionFound=true;
            code+=codeFuncEnd;
          }
          let func=parseFunction(src,node, parsingInfos);
          infos.outline.push(func);
          code+=func.code;
        }else if(node.type.name==="ClassDeclaration"){
          if(!parsingInfos.firstFunctionFound){
            parsingInfos.firstFunctionFound=true;
            code+=codeFuncEnd;
          }
          let clazz=parseClass(src,node,parsingInfos);
          code+=clazz.code;
        }else{
          code+=parseStatement(src,node,parsingInfos);
        }
        node=node.nextSibling;
      }
      if(!parsingInfos.firstFunctionFound){
        code+=codeFuncEnd;
      }
    }catch(e){
      infos.error=e;
    }
    code=addAwaits(code);
    node=tree.topNode.firstChild;
    let variables={};
    if(!options.dontParseGlobalVariables && node){
      getAllVariables(src,node,variables,true);
    }
    infos.variables=variables;
    infos.code=code;
    resolve(infos);
  })
  return await p;
}

function getWortVorher(code,pos){
  var index=pos;
  //skip whitespace:
  var gefunden=false;
  while(!gefunden && index>0){
    var c=code.charAt(index-1);
    gefunden=!(/\s/.test(c));
    index--;
  }
  if(!gefunden) return null;
  var gefunden=false;
  pos=index+1;
  index=pos;
  while(!gefunden && index>0){
    var c=code.charAt(index-1).toLowerCase();
    gefunden=!(/[$\[\].a-z0-9_]/.test(c));
    index--;
  }
  if(gefunden){
    var wortVorher=code.substring(index+1,pos);
    return {wort: wortVorher, index: index};
  }
  return null;
}

function addAwaits(code){
  //fuegt vor jedem Wort vor jeder oeffnenden Klammer "await " hinzu
  var pos=0;
  pos=code.indexOf("(",pos);
  while(pos>=0){
    var vorher=getWortVorher(code,pos);
    if(vorher){
      var wortVorher=vorher.wort;
      if(wortVorher.length>0 && wortVorher!=="await" && wortVorher!=="function" && wortVorher!=="catch" && wortVorher!=="if" && wortVorher!=="while" && wortVorher!=="for"){
        var vorher2=getWortVorher(code,vorher.index);
        if(vorher2){
          wortVorher=vorher2.wort;
          if(wortVorher!=="function" && wortVorher!=="await"){
            code=code.substring(0,vorher.index+1)+"await "+code.substring(vorher.index+1);
            pos+=6;
          }
        }else{
          code=code.substring(0,vorher.index+1)+"await "+code.substring(vorher.index+1);
          pos+=6;
        }
      }
    }
    pos++;
    pos=code.indexOf("(",pos);
  }
  return code;
}

function createError(message,node){
  return {
    isError: true,
    message: message,
    pos: node.from
  };
}

function parseFunction(src,node,parsingInfos){
  let from=node.from;
  let to=node.to;
  node=node.firstChild;
  while(node && node.type.name!=="VariableDefinition"){
    node=node.nextSibling;
  }
  let fname=src.substring(node.from,node.to);
  let params=[];
  node=node.nextSibling;
  let paramList=node;
  if(paramList && paramList.firstChild){
    let param=paramList.firstChild.nextSibling;
    while(param && param.type.name!==")"){
      if(param.type.name==="VariableDefinition"){
        params.push(src.substring(param.from,param.to));
      }
      param=param.nextSibling;
    }
  }else{
    throw createError("Es fehlt '()' hinter dem Funktionsnamen.");
  }
  while(node && node.type.name!=="Block"){
    node=node.nextSibling;
  }
  let code="async function "+fname+src.substring(paramList.from,paramList.to);
  code+=parseCodeBlock(src,node,parsingInfos);
  
  let func={
    type: "function",
    params: params,
    from: from,
    to: to,
    name: fname,
    code: code,
    alreadyDefined: parsingInfos.usedNames[fname]!==undefined
  }
  parsingInfos.usedNames[fname]=true;
  return func;
}

function parseCodeBlock(src,node,parsingInfos){
  let code="{";
  node=node.firstChild;
  while(node.nextSibling && node.nextSibling.type.name!=="}"){
    node=node.nextSibling;
    code+=parseStatement(src,node,parsingInfos);
  }
  node=node.nextSibling;
  code+=extractLineBreaks(src,node,parsingInfos);
  return code+"}";
}

function extractLineBreaks(src,node,parsingInfos){
  let lb='';
  let between=src.substring(parsingInfos.lastPos,node.from);
  let pos=between.indexOf("\n");
  while(pos>=0){
    lb+="\n";
    pos=between.indexOf("\n",pos+1);
  }
  parsingInfos.lastPos=node.from+1;
  return lb;
}

function parseClass(src,node,parsingInfos){
  let code=src.substring(node.from,node.to);
  return {
    code: code
  };
}

function parseStatement(src,node,parsingInfos){
  let code="await $App.debug.line("+node.from+");";
  
  if(node.type.name==="VariableDeclaration"){
    code+=extractLineBreaks(src,node,parsingInfos);
    let c=src.substring(node.from,node.to);
    if(!parsingInfos.firstFunctionFound && node.firstChild.type.name==="var"){
      c=c.substring(4);
    }
    code+=c+";";
  }else if(node.name==="ReturnStatement"){
    code+=extractLineBreaks(src,node,parsingInfos);
    let c=src.substring(node.from+6,node.to);
    code+="return await "+c+";";
  }else if(node.type.name.indexOf("Expression")<0 && node.firstChild){
    code+=parseSpecialStatement(src,node.firstChild,parsingInfos);
  }else{
    code+=extractLineBreaks(src,node,parsingInfos);
    if(node.name==="ExpressionStatement" && node.firstChild && node.firstChild.name==="CallExpression"){
      code+="await ";
    }
    code+=src.substring(node.from,node.to)+";";  
  }
  return code;
}

function parseSpecialStatement(src,node,parsingInfos){
  let code="";
  while(node){
    code+=extractLineBreaks(src,node,parsingInfos);
    if(node.name==="Block"){
      code+=parseCodeBlock(src,node,parsingInfos);
    }else{
      code+=src.substring(node.from,node.to)+" ";
    }
    node=node.nextSibling;
  }
  return code;
}

function parseCode(src,node,parsingInfos){
  let code="";
  if(node.name==="CallExpression"){
    code="await "
  }
}

function getAllVariables(src,node,variables,started){
  //console.log(src.substring(node.from,node.to));
  if(!started && node.type.name.indexOf("Expression")>=0){
    if(node.type.name==="ExpressionStatement"){
      let n=node.firstChild;
      if(n && n.type.name==="AssignmentExpression"){
        n=n.firstChild;
        if(n && n.type.name==="VariableName"){
          let v=src.substring(n.from,n.to);
          variables[v]=true;
        }
      }
    }
  }else if(node.type.name==="FunctionDeclaration"||node.type.name==="Block"){
    getAllVariables(src,node.firstChild,variables);
  }
  if(node.nextSibling){
    node=node.nextSibling;
    getAllVariables(src,node,variables);
  }
}