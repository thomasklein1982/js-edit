export const parse=async function(src,tree,options){
  let p=new Promise(function(resolve,reject){
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
    resolve(infos);
  })
  return await p;
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