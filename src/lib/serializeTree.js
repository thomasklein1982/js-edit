export function serializeTree(tree){
  let t1=new Date();
  let o=serializeNode(tree.topNode);
  let t2=new Date();
  console.log("serialized in "+(t2-t1)+"ms");
  console.log(o);
  return o;
}

function serializeNode(node){
  if(!node){
    return null;
  }
  var t={};
  t.from=node.from;
  t.to=node.to;
  t.firstChild=serializeNode(node.firstChild);
  t.name=node.name;
  t.nextSibling=serializeNode(node.nextSibling);
  return t;
}