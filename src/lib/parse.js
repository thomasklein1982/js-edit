export const parse=async function(src,tree){
  let p=new Promise(function(resolve,reject){
    console.log(tree);
    let infos={
      outline: []
    };
    let node=tree.topNode.firstChild;
    do{
      if(node.type.name==="FunctionDeclaration"){
        let fname=src.substring(node.firstChild.nextSibling.from,node.firstChild.nextSibling.to);
        let func={
          type: "function",
          from: node.from,
          to: node.to,
          name: fname
        }
        infos.outline.push(func);
      }
      node=node.nextSibling;
    }while(node)
    resolve(infos);
  })
  return await p;
}