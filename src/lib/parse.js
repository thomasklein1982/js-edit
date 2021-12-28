export const parse=async function(src,tree,options){
  let p=new Promise(function(resolve,reject){
    let infos={
      outline: [],
      variables: null,
      codeDebugging: null
    };
    let code='(async function(){try{';
    let usedNames={};
    let node=tree.topNode.firstChild;
    let firstFunctionFound=false;
    /**wrappe allen Code, der vor der ersten Funktion auftaucht, in eine funktion und fuehre diese direkt aus */
    while(node){
      if(node.type.name==="FunctionDeclaration"){
        if(!firstFunctionFound){
          firstFunctionFound=true;
          code+="}catch(e){$App.handleException(e);}})(); ";
        }
        let func=parseFunction(src,node, usedNames);
        infos.outline.push(func);
        code+=func.code+"\n";
      }else{
        code+=parseStatement(src,node);
      }
      node=node.nextSibling;
    }
    if(!firstFunctionFound){
      code+="}catch(e){$App.handleException(e);}})(); ";
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

function parseFunction(src,node,usedNames){
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
  }
  while(node && node.type.name!=="Block"){
    node=node.nextSibling;
  }
  let code="async function "+fname+src.substring(paramList.from,paramList.to);
  code+=parseCodeBlock(src,node);
  
  let func={
    type: "function",
    params: params,
    from: from,
    to: to,
    name: fname,
    code: code,
    alreadyDefined: usedNames[fname]!==undefined
  }
  usedNames[fname]=true;
  return func;
}

function parseCodeBlock(src,node){
  let code="{";
  node=node.firstChild;
  while(node.nextSibling){
    node=node.nextSibling;
    code+=parseStatement(src,node);
  }
  return code;
}

function parseStatement(src,node){
  let code="await $App.debug.line("+node.from+");";
  if(node.type.name.indexOf("Expression")<0 && node.firstChild){
    code+=parseSpecialStatement(src,node.firstChild);
  }else{
    //console.log(node.name);
    if(node.name==="ExpressionStatement" && node.firstChild && node.firstChild.name==="CallExpression"){
      code+="await ";
    }
    code+=src.substring(node.from,node.to);  
  }
  code+="\n";
  return code;
}

function parseSpecialStatement(src,node){
  let code="";
  while(node){
    if(node.name==="Block"){
      code+=parseCodeBlock(src,node);
    }else{
      code+=src.substring(node.from,node.to);
    }
    node=node.nextSibling;
  }
  return code;
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
 