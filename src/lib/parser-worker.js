const state="idle";
const repeatAfterRunning=false;

onmessage=function(e){
  console.log(e);
  if(e.type==="check"){
    if(state==="idle"){
      check(e.src,e.tree,e.view,e.options);
    }else{
      repeatAfterRunning=true;
    }
  }
};

function check(src,tree,view,options){
  let infos=parse(src,tree,view,options);
  try{
    let ast=acorn.parse(src, {ecmaVersion: 2020});
    
  }catch(e){
    let t="Zeile "+errors.loc.line+": ";
    if(e.message.startsWith("Unexpected token")){
      if(e.pos>=src.length){
        t+="Unerwartes Ende des Codes. Fehlt eine '}'?"
      }else{
        t+="Unerwartetes Zeichen";
      }
      
    }else{
      t+=e.message;
    }
    postMessage({
      type: "error",
      error: t
    });
  }
}

function parse(src,tree,options){
  let infos={
    outline: [],
    variables: null
  };
  let usedNames={};
  let node=tree.topNode.firstChild;
  while(node){
    if(node.type.name==="FunctionDeclaration"){
      let fname=src.substring(node.firstChild.nextSibling.from,node.firstChild.nextSibling.to);
      let params=[];
      let paramList=node.firstChild.nextSibling.nextSibling;
      if(paramList && paramList.firstChild){
        let param=paramList.firstChild.nextSibling;
        while(param && param.type.name!==")"){
          if(param.type.name==="VariableDefinition"){
            params.push(src.substring(param.from,param.to));
          }
          param=param.nextSibling;
        }
      }

      let func={
        type: "function",
        params: params,
        from: node.from,
        to: node.to,
        name: fname,
        alreadyDefined: usedNames[fname]!==undefined
      }
      usedNames[fname]=true;
      infos.outline.push(func);
    }
    node=node.nextSibling;
  }

  node=tree.topNode.firstChild;
  let variables={};
  if(!options.dontParseGlobalVariables && node){
    getAllVariables(src,node,variables);
  }
  infos.variables=variables;
  return infos;
}

function getAllVariables(src,node,variables){
  if(node.type.name==="ExpressionStatement"){
    node=node.firstChild;
    if(node && node.type.name==="AssignmentExpression"){
      node=node.firstChild;
      if(node && node.type.name==="VariableName"){
        let v=src.substring(node.from,node.to);
        variables[v]=true;
      }
    }
  }else{
    while(node){
      if(node.firstChild){
        getAllVariables(src,node.firstChild,variables);
      }
      if(node.nextSibling){
        getAllVariables(src,node.nextSibling,variables);
      }
      node=node.nextSibling;
    };
  }
  
}