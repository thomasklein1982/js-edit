
export function download(data,filename,mime,noDownload){
  window.URL =  window.URL || window.webkitURL;
  if(!filename) filename="Download.txt";
  if(!mime || !mime.substring){
    var split=filename.split(".");
    if(split.length>0){
      var extension=split[split.length-1];
      mime="text/"+extension;
    }else{
      var extension="txt";
      mime="text";
      filename+=extension;
    }
  }else{
    if(mime.substring(0,4).toLowerCase()!="text"){
      /*dataurl*/
      var bin = atob(data.split(',')[1]);
      var arrayBuffer=new ArrayBuffer(bin.length),
      data=new Uint8Array(arrayBuffer);
      for(var i=0;i<bin.length;i++) data[i]=bin.charCodeAt(i);
    }
  }
  var blob = new Blob([data], {type: mime});
  var downloadAnchor=document.createElement("a");
  downloadAnchor.style.display="none";
  document.body.appendChild(downloadAnchor);
  if(noDownload!==true){
    downloadAnchor.download = filename;
  }else{
    downloadAnchor.target="_blank";
  }
  let objectURL=window.URL.createObjectURL(blob);
  downloadAnchor.href=objectURL;
  downloadAnchor.dataset.downloadurl = [mime, downloadAnchor.download, downloadAnchor.href].join(':');
  downloadAnchor.click();
  setTimeout(function(){
    window.URL.revokeObjectURL(objectURL);
  },200);
  document.body.removeChild(downloadAnchor);
}

function uploadCallback(callback,options){
  var fi=document.createElement("input");
  fi.type="file";
  if(options && options.accept) fi.accept=options.accept;
  if(options && options.that) fi.that=options.that; else fi.that=null;
  fi.name="files[]";
  fi.style.display="none";
  fi.options=options;
  fi.callback=callback;
  document.body.appendChild(fi);
  if(options && options.multi){fi.multiple=true;}
  if(options && options.dataURL){fi.dataURL=options.dataURL;}

  fi.handleCallback=function(filesLeft){
    var fileReader=new FileReader();
    fileReader.fileInput=fi;
    if(this.options && this.options.object) fileReader.object=this.options.object;
    fileReader.callback=this.callback;
    var file=this.files[this.files.length-filesLeft];
    fileReader.fileName=file.name;
    fileReader.mime=file.type;
    fileReader.that=this.that;
    fileReader.filesLeft=filesLeft;
    fileReader.onload = function(e){
      var code=e.target.result;
      if(this.that){
        this.callback.call(this.that,code,this.fileName,this.mime,this.filesLeft-1);
      }else{
        this.callback(code,this.fileName,this.mime,this.filesLeft-1);
      }
      if(this.filesLeft>1){
        this.fileInput.handleCallback(this.filesLeft-1);
      }
    };
    if(this.dataURL){
      fileReader.readAsDataURL(file);
    }else{
      fileReader.readAsText(file);
    }
  };

  fi.onchange=function(e){
    var filesLeft=this.files.length;
    fi.handleCallback(filesLeft);
  };
  fi.click();
  document.body.removeChild(fi);
}

export async function upload(options){
  var p=new Promise(function(resolve,reject){
    uploadCallback(function(code,fileName,mime,filesLeft){
      resolve({
        code: code,
        fileName: fileName,
        mime: mime
      });
    },options);
  });
  var q=await p;
  return q;
}

export async function saveLocally(key,data){
  var s=JSON.stringify(data);
  var c=LZString.compress(s);
  localStorage.setItem(key,c);
  //await localforage.setItem(key,c);
}

export async function loadLocally(key){
  //var c=await localforage.getItem(key);
  var c=localStorage.getItem(key);
  if(c===undefined || c===null){
    return null;
  }
  var s=LZString.decompress(c);
  var data=JSON.parse(s);
  return data;
}