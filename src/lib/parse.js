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
      getAllVariables(src,node,variables,true);
    }
    infos.variables=variables;
    resolve(infos);
  })
  return await p;
}

function getAllVariables(src,node,variables,started){
  console.log(src.substring(node.from,node.to));
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