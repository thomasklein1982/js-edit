export const parse=async function(src,tree,options,state){
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
      usedNames: {},
      state: state,
      debugging: options.debugging
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
  let code;
  if(parsingInfos.debugging){
    code="async function "+fname+src.substring(paramList.from,paramList.to);
    code+=parseCodeBlock(src,node,parsingInfos);   
  }else{
    code+=src.substring(from,to);
  }
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
  if(!parsingInfos.debugging){
    return "";
  }
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
  if(!parsingInfos.debugging){
    let code=src.substring(node.from,node.to);
    return code;
  }
  let line=parsingInfos.state.doc.lineAt(node.from).number;
  let code;
  code="await $App.debug.line("+line+",true);";
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
    let c=src.substring(node.from,node.to);
    if(node.name==="ExpressionStatement" && node.firstChild){ 
      if(node.firstChild.name==="CallExpression"){
        code+="await ";
        //TODO: bei jedem Argument ein await hinzufügen
      }else if(node.firstChild.name==="AssignmentExpression"){
        let pos=c.indexOf("=");
        code+=c.substring(0,pos+1)+"await ";
        c=c.substring(pos+1);
      }
    }
    code+=c+";";  
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