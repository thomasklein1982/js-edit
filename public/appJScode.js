window.appJScode=function(){
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  window.onmessage=function(message){
    $App.debug.onMessage(message);
  };
  
  Object.defineProperty(window,"assets",{
    get: function(){
      return $App.assets;
    }
  })

  window.$App={
    version: 20,
    language: window.language? window.language:'js',
    setupData: null,
    debug: {
      enabled: window.appJSdebugMode? window.appJSdebugMode: false,
      breakpoints: {},
      breakpointCount: 0,
      paused: false,
      resolve: null,
      line: async function(line,name){
        if(window===window.top) return;
        if(!name){
          name=true;
        }
        if(this.paused || this.breakpoints[line]===name){
          this.paused=true;
          if($App.body.overlay){
            $App.body.overlay.style.display='';
          }
          var p=new Promise((resolve,reject)=>{
            window.parent.postMessage({
              type: "debug-pause",
              line: line,
              name: name
            });
            this.resolve=resolve;
          });
          var q=await p;
          return q;
        }
      },
      setBreakpoints: function(bp){
        this.breakpoints={};
        if(!bp){
          this.breakpointCount=0;
          return;
        }
        this.breakpointCount=bp.length;
        for(var i=0;i<bp.length;i++){
          var n,f;
          if(bp[i].n){
            n=bp[i].n;
            f=bp[i].f;
          }else{
            n=bp[i];
            f=true;
          }
          this.breakpoints[n]=f;
        }
      },
      onMessage: function(message){
        var data=message.data;
        if(data.type==="breakpoints"){
          var bp=data.breakpoints;
          this.setBreakpoints(bp);
        }else if(data.type==="debug-resume"){
          this.paused=false;
          this.resolve();
        }else if(data.type==="debug-step"){
          this.resolve();
        }
        if(this.paused){
          if($App.body.overlay && $App.body.overlay.style.display==='none'){
            $App.body.overlay.style.display='';
          }
        }else{
          if($App.body.overlay && $App.body.overlay.style.display!=='none'){
            $App.body.overlay.style.display='none';
          }
        }
      }
    },
    assets: {},
    scripts: [],
    headLoaded: false,
    body: {
      element: null,
      root: null,
      right: null,
      overlay: null,
      width: 0,
      height: 0
    },
    toast: null,
    keyboard: {
      down: [],
      lastKeycodeDown: null
    },
    audio: {
      context: null,
      play: function(audio){
        audio.currentTime=0;
        audio.play()
      }
    },
    mouse: {
      down: false,
      x: -1,
      y: -1,
      lastTouch: {
        move: -1,
        down: -1,
        up: -1
      },
      update: function(clientX,clientY,target,eventName,time,isTouch){
        var r=target.getBoundingClientRect();
        this.x=clientX-r.left;
        this.y=(clientY-r.top);
        if(isTouch){
          this.lastTouch[eventName]=time;
        }else{
          var lt=this.lastTouch[eventName];
          if(lt>=0 && Math.abs(time-lt)<500){
            return;
          }
        }
        if($App.debug.paused) return;
        if(eventName==='down' && window.onMouseDown){
          try{
            window.onMouseDown();
          }catch(e){
            $App.handleException(e);
          }
        }else if(eventName==='up' && window.onMouseUp){
          try{
            window.onMouseUp();
          }catch(e){
            $App.handleException(e);
          }
        }else if(eventName==='move' && window.onMouseMove){
          try{
            window.onMouseMove();
          }catch(e){
            $App.handleException(e);
          }
        }
      }
    },
    executedOnStart: false,
    animationFrame: null,
    gamepad: null,
    canvas: null,
    world: null,
    showConsoleOnStart: true
  };
  
  window.onerror=function(message, source, lineno, colno, error){
    $App.handleError({
      message: message,
      line: lineno,
      col: colno,
      completeMessage: "Fehler in Zeile "+lineno+", Position "+colno+": "+message
    });
    
  };
  
  $App.handleError=function(errorData){
    if(window.parent!==window){
      window.parent.postMessage({type: "error", data: errorData});
    }else{
      console.log(errorData.completeMessage);
    }
  }
  
  $App.handleException=function(e){
    var m;
    var line=-1;
    var col=-1;
    if(e && e.substring){
      m=e;
    }else{
      m=e.message;
    }
    if(e.stack){
      var stack=e.stack;
      var pos=stack.lastIndexOf("(");
      var pos2=stack.lastIndexOf(")");
      if(pos>0 && pos2>0){
        var zeile=stack.substring(pos+1,pos2);
        //TODO: Verweise auf appJS herausnehmen??
      }
    }else{
      stack=m;
    }
    
    $App.handleError({
      message: m,
      line: line,
      col: col,
      completeMessage: stack
    });
  }
  
  $App.createElement=function(tagname){
    let el=document.createElement(tagname);
    el.style.boxSizing="border-box";
    el.style.display="flex";
    this.implementStyleGetterAndSetter(el);
    el.appJSData={
      oldDisplayValue: undefined,
      cx: null,
      cy: null,
      width: null,
      height: null,
      align: $App.Canvas.$getAlignment("center"),
      alignContent: $App.Canvas.$getAlignment("center")
    };
    el.updatePosition=function(cx,cy,width,height,align){
      $App.canvas.updateElementPosition(this,cx,cy,width,height,align);
    };
    el.updateAlignContent=function(v){
      var a=$App.Canvas.$getAlignment(v);
      this.appJSData.alignContent=a;
      console.log(a);
      if(a.h==="center"){
        this.style.justifyContent="center";
      }else if(a.h==="left"){
        this.style.justifyContent="flex-end";
      }else{
        this.style.justifyContent="flex-start";
      }
      if(a.v==="middle"){
        this.style.alignItems="center";
      }else if(a.v==="top"){
        this.style.alignItems="flex-end";
      }else{
        this.style.alignItems="flex-start";
      }
    };
    el.updateAlignContent();
    Object.defineProperty(el,'align', {
      set: function(v){
        this.appJSData.align=$App.Canvas.$getAlignment(v);
        this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height, this.appJSData.align);
      },
      get: function(){
        return this.appJSData.align.h+" "+this.appJSData.align.v;
      }
    });
    Object.defineProperty(el,'alignContent', {
      set: function(v){
        this.updateAlignContent(v);
      },
      get: function(){
        return this.appJSData.align.h+" "+this.appJSData.align.v;
      }
    });
    Object.defineProperty(el,'cx', {
      set: function(v){
        this.appJSData.cx=v;
        this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height, this.appJSData.align);
      },
      get: function(){
        return this.appJSData.cx;
      }
    });
    Object.defineProperty(el,'cy', {
      set: function(v){
        this.appJSData.cy=v;
        this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height, this.appJSData.align);
      },
      get: function(){
        return this.appJSData.cy;
      }
    });
    Object.defineProperty(el,'width', {
      set: function(v){
        this.appJSData.width=v;
        this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height, this.appJSData.align);
      },
      get: function(){
        return this.appJSData.width;
      }
    });
    Object.defineProperty(el,'height', {
      set: function(v){
        this.appJSData.height=v;
        this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height, this.appJSData.align);
      },
      get: function(){
        return this.appJSData.height;
      }
    });
    if(tagname==="select"){
      el._options=el.options;
      Object.defineProperty(el, 'options', {
        set: function(options) { 
          while(this.firstChild){
            this.removeChild(this.firstChild);
          }
          for(let i=0;i<options.length;i++){
            let opt=options[i];
            let o=document.createElement("option");
            o.innerHTML=opt;
            this.appendChild(o);
          }
        },
        get: function(){
          return this._options;
        }
      });
    }else if(tagname==="button"){
      el.addEventListener("click",function(){
        if(window.onAction){
          try{
            window.onAction(this);
          }catch(e){
            $App.handleException(e);
          }
        }
      });
      el.appJSData.label="";
      Object.defineProperty(el,'value', {
        set: function(v){
          this.appJSData.value=v;
          this.innerHTML=v;
          //this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height);
        },
        get: function(){
          return this.appJSData.value;
        }
      });
    }else if(tagname==="img"){
      Object.defineProperty(el,'value', {
        set: function(v){
          this.appJSData.value=v;
          this.src=v;
        },
        get: function(){
          return this.src;
        }
      });
    }else if(tagname==="div"){
      Object.defineProperty(el,'value', {
        set: function(v){
          this.appJSData.value=v;
          this.innerHTML=v;
          //this.updatePosition(this.appJSData.cx,this.appJSData.cy, this.appJSData.width, this.appJSData.height);
        },
        get: function(){
          return this.appJSData.value;
        }
      });
    }else if(tagname==="input"){
      // Object.defineProperty(el,'value', {
      //   set: function(v){
      //     this.appJSData.value=v;
      //     this.innerHTML=v;
      //   },
      //   get: function(){
      //     return this.appJSData.value;
      //   }
      // });
    }
    Object.defineProperty(el, 'visible', {
      set: function(v) {
        if(!v){
          this.appJSData.oldDisplayValue=this.style.display;
          this.style.display="none";
        }else{
          this.style.display=this.appJSData.oldDisplayValue;
        }
      },
      get: function(){
        return this.style.display!=="none";
      }
    });
    return el;
  };
  
  $App.implementStyleGetterAndSetter=function(el){
    el._style=el.style;
    Object.defineProperty(el, 'style', {
      set: function(s) {
        let rules=s.split(";");
        for(let i=0;i<rules.length;i++){
          let r=rules[i].trim();
          let kv=r.split(":");
          if(kv.length===2){
            this._style[kv[0]]=kv[1];
          }
        }
      },
      get: function(){
        return this._style;
      }
    });
  };
  
  
  $App.$JoyStick=function(t,onDown,onUp,e){var i=void 0===(e=e||{}).title?"joystick":e.title,n=void 0===e.width?0:e.width,o=void 0===e.height?0:e.height,r=void 0===e.internalFillColor?"#00AA00":e.internalFillColor,h=void 0===e.internalLineWidth?2:e.internalLineWidth,a=void 0===e.internalStrokeColor?"#003300":e.internalStrokeColor,d=void 0===e.externalLineWidth?2:e.externalLineWidth,f=void 0===e.externalStrokeColor?"#008000":e.externalStrokeColor,l=void 0===e.autoReturnToCenter||e.autoReturnToCenter,s=t,c=document.createElement("canvas");c.id=i,0===n&&(n=s.clientWidth),0===o&&(o=s.clientHeight),c.width=n,c.height=o,s.appendChild(c);var u=c.getContext("2d"),g=0,v=2*Math.PI,p=(c.width-(c.width/2+10))/2,C=p+5,w=p+30,m=c.width/2,L=c.height/2,E=c.width/10,P=-1*E,S=c.height/10,k=-1*S,W=m,T=L;function G(){u.beginPath(),u.arc(m,L,w,0,v,!1),u.lineWidth=d,u.strokeStyle=f,u.stroke()}function x(){u.beginPath(),W<p&&(W=C),W+p>c.width&&(W=c.width-C),T<p&&(T=C),T+p>c.height&&(T=c.height-C),u.arc(W,T,p,0,v,!1);var t=u.createRadialGradient(m,L,5,m,L,200);t.addColorStop(0,r),t.addColorStop(1,a),u.fillStyle=t,u.fill(),u.lineWidth=h,u.strokeStyle=a,u.stroke()}"ontouchstart"in document.documentElement?(c.addEventListener("touchstart",function(t){g=1;if(onDown){onDown()}},!1),c.addEventListener("touchmove",function(t){t.preventDefault(),1===g&&t.targetTouches[0].target===c&&(W=t.targetTouches[0].pageX,T=t.targetTouches[0].pageY,"BODY"===c.offsetParent.tagName.toUpperCase()?(W-=c.offsetLeft,T-=c.offsetTop):(W-=c.offsetParent.offsetLeft,T-=c.offsetParent.offsetTop),u.clearRect(0,0,c.width,c.height),G(),x())},!1),c.addEventListener("touchend",function(t){g=0,l&&(W=m,T=L);u.clearRect(0,0,c.width,c.height),G(),x();if(onUp){onUp()}},!1)):(c.onmouseleave=function(){g=0,l&&(W=m,T=L);u.clearRect(0,0,c.width,c.height),G(),x();if(onUp){onUp()}},c.addEventListener("mousedown",function(t){g=1;if(onDown){onDown()}},!1),c.addEventListener("mousemove",function(t){1===g&&(W=t.pageX,T=t.pageY,"BODY"===c.offsetParent.tagName.toUpperCase()?(W-=c.offsetLeft,T-=c.offsetTop):(W-=c.offsetParent.offsetLeft,T-=c.offsetParent.offsetTop),u.clearRect(0,0,c.width,c.height),G(),x())},!1),c.addEventListener("mouseup",function(t){g=0,l&&(W=m,T=L);u.clearRect(0,0,c.width,c.height),G(),x();if(onUp){onUp()}},!1)),G(),x(),this.GetWidth=function(){return c.width},this.GetHeight=function(){return c.height},this.GetPosX=function(){return W},this.GetPosY=function(){return T},this.GetX=function(){return((W-m)/C*100).toFixed()},this.GetY=function(){return((T-L)/C*100*-1).toFixed()},this.setDir=function(dir){if(dir==="N"){W=m;T=-1000;}else if(dir==="S"){W=m;T=1000;}else if(dir==="W"){W=-1000;T=L;}else if(dir==="E"){W=1000;T=L;}else if(dir==="NW"){W=-1000;T=-1000;}else if(dir==="NE"){W=1000;T=-1000;}else if(dir==="SW"){W=-1000;T=1000;}else if(dir==="SE"){W=1000;T=1000;}else{W=m;T=L;}u.clearRect(0,0,c.width,c.height),G(),x();},this.GetDir=function(){var t="",e=W-m,i=T-L;return i>=k&&i<=S&&(t="C"),i<k&&(t="N"),i>S&&(t="S"),e<P&&("C"===t?t="W":t+="W"),e>E&&("C"===t?t="E":t+="E"),t}};
  
  $App.setup=async function(dontStart){
    await this.loadScripts();
    await this.loadAssets();
    if(!$App.headLoaded && document.head){
      var meta=document.createElement("meta");
      meta.setAttribute("charset","utf-8");
      document.head.appendChild(meta);
      meta=document.createElement("meta");
      meta.setAttribute("name","viewport");
      meta.setAttribute("content","width=device-width, initial-scale=1");
      document.head.appendChild(meta);
      $App.headLoaded=true;
    }
    if(!dontStart && document.body){
      this.body.element=document.body;
      this.body.element.style="padding: 0; margin: 0; width: 100%; height: 100%; overflow: hidden";
      this.body.element.parentElement.style=this.body.style;
      // var style=document.createElement("style");
      // document.head.appendChild(style);
      // style=style.sheet;
      // style.insertRule(".toast{}",0);
      var root=document.createElement("div");
      this.body.root=root;
      root.style="font-family: sans-serif;position: fixed;width:100%;height:100%";
      root.className="app-root";
      this.body.element.appendChild(root);
      this.canvas=new $App.Canvas(root,100,100);
      this.world=new $App.World(this.canvas);
      let left=document.createElement("div");
      left.style="font-family: monospace; position: absolute; width: 30%; height: 100%; left: 0; top: 0; display: none";
      let right=document.createElement("div");
      right.style="position: absolute; width: 100%; height: 100%; right: 0; top: 0; display: grid; box-sizing: border-box; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; padding: 1rem";
      this.body.right=right;
      root.appendChild(left);
      root.appendChild(right);
      left.appendChild(this.console.element);
      right.appendChild(this.canvas.container);
      this.body.overlay=document.createElement("div");
      this.body.overlay.style="display: none; position: absolute; width: 100%; height: 100%; top: 0; right: 0; background-color: #00000030";
      right.appendChild(this.body.overlay);
      this.toast=new $App.Toast(right);
      root.appendChild(this.help.element);
      left.appendChild(this.help.helpButton);
      var audioEnabler=document.createElement("audio");
      audioEnabler.src="data:audio/mpeg;base64,//uQRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAjAAASZAAGBgwMDBISEhgYGB8fHyUlJSsrMTExNzc3Pj4+RERESkpKUFBQVlZdXV1jY2NpaWlvb291dXV8fHyCgoiIiJiYmKSkpK+vr7q6usXFxcvL1NTU3Nzc5eXl7e3t8/Pz+fn5//8AAAA8TEFNRTMuMTAwBK8AAAAAAAAAADUgJAKlTQABzAAAEmSp58jHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBkIg/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGRED/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZGYP8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBkiA/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGSqD/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZMwP8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk3Y/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTdj/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZN2P8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBE3Y/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTdj/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZN2P8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk3Y/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTdj/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRaFA2GwYEyhRAAAP8x4KLuHsCIORf9pjEzASscGv9Ydg7ep//sQZN2P8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAEKYfIOwWWMDsmZizAbIAMnyuJ3K8EdCvDSIJ9NNNBA3SQSMvDAfCoaF+kaBAw4Rfvh85Eur9j7XdP/T+pHyqf/+z/7gr/+xBk3Y/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAASwkAlAlQdQhhwOAAAAAAMAoGDIAaeCYGDgLkEFbo8UGO9L4AQPNv0hGmf9BdwL8oz6nA/ELBsro6C/gAAHwOmGBsdGQP/7EGTdj/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABGdlCaX7YW/sSWInNLZ9xaBsSIwMFUklSZPFLDUS0ssm96+nNYUryd87jsyVV80OLt3Cd/1xAAAADoEQgLzJh3IlViQw//sQZN2P8AAAf4AAAAgAAA/wAAABAAAB/gAAACAAAD/AAAAE/wAAA+2qZLMqE9smomiaFmVJ6rs6hkOkqENHnMGUoVT+taJa6eJ1b/yorkzGdfAad7nxx9NoLOr13oX/u42ixH7E2Tf/+xBk3Y/wAAB/gAAACAAAD/AAAAEAAAH+AAAAIAAAP8AAAAT6PR3//6f/42i85sZ9tWt3SGaGJUF3BEWJQfKdaUeN5AE9mqgSdSGqwTjicnahAFjA4UeZXUSjV/pqUoeDTt6yh8Sk7v/7EGTdj/AAAH+AAAAIAAAP8AAAAQAAAf4AAAAgAAA/wAAABNRxYKps6jU0jmEbtNZbe9zPqZLOXXTruu/9fqtw5qfiOs39iaNiPC0x3sWzQta1HQkFqAAAXlFPUOephcAjQnB1nmQ4//sQZN2P8AAAf4AAAAgAAA/wAAABAAAB/hQAACAAAD/CgAAEM5Vog21cc5AasJoliJZa0ioTs2yAQ0Y2kVYpHbPfQvoa/XtbNZIhNgLyshp7pkOAgBa3p9oIU0hOEMu1nWso1X7XNN7/+2Bk/4ADMB5H5m5AADQiib/KoAAIoF8v/aeACCaA5VO0AAXReLqpKSUA3SZOrKTPo1KonEKCet/s6f/v/Z2///9Fv/ev+z66smv0lQvAAABXx7Yxw+RMwqkCglSZggiaQP6qZ1CrkhQ4pkZ8sxzGnT7SyjzSaX3NQE3/2f6////d9v/9////v//9dbcZihEjRROCYKp9PESOg6S9vdEKVQ+jjfqFGMTGsZUqTi+tyavnYsFMQCLw00tibwiB4539YNf/R/7R+zV//0be57/an2/07UVert471axZXEVbCFWt1u0JiQAAAFa4/PjFUPAsi5uhvRh8pUaJFI5dszK/iIIGtHP/+1Bk+4HxyhjL+y9IUh/AOJBgIAAG7F0x7C0sAKkAogEAAAAW88qeLBcqVIoksy+okF////////6aTd6KgHmuXNJKbbMI8FCF2RxXK8XMsQZWgBItHI6jLBmrB0ez9NIpDqJVzij0MfooRF0gi1XNTd//r390jNJ0fxWz/X67f/jP8nR70Vfjk6+paEUUjZgAADyYGmb4E8G0ahTF9NkoEMlSiFmREBArCGL54spdxUcTQ66vcw4V5VWRQCW8SzrBnBbiFmWfqeH61bf0eo5m//tAZPQB8bgXymnmQ7ICYBjAGAABBnxhLaY8xYBJAKKAkAAA0zm7GBNWbaINK4TcesF1pq2KgAARimoFz7lsrEsHKRaUADE4FB14ClDwvx3e8qoNogZA9GEJdCWxW1s/0f/18ntrZrvZkaf9bunvG+zeUt/9lvc73o/1a07owAI874mr1cDERZM422w5x97th49YnNj98Pu2qPOBfRh1gcbjTVIAAD3Vuc3sigI6nc2lXHazMtP/+0Bk/QHxhRhLae8xwhHAGLAsAAAGwF8jrDzDwHsAokDQAAAPliWDpSKST5xwIIHcFaBX//+tf/+v6/+7/17K9Smv+j//Z9v/FZOZUQKpdO38bl/DYRjW5s5apY/6/bnGWYgxv5d01EeHmIfsO///3/////9HUpq4V4Aa7+axek9CQ1gfiOlYjXqxHkBAIUjzNmSmbTiVez0nMCU6YtC//tUr/1fpv/s/dqT+//9H6ndHUn//ev/7QGT6AfGNFsjrD0BwB+AY0CwAAAZcXx0nsMxAeYCiQNAAAGlaJJAIplU6ZfSZYVVh4ol961O8IcWWa/1CBkEKOVIsHf/9930/1f9H///3d3//9X//TYw4oI3UAAEUxGJ79B4TJOtZiPDlFDlZqWto8QbpDvptT///32/t0/utt3/f/b/pssXv3f/e3RLIiAXMV2YwJRO9SiGZGg3///+z/////9lfu+pMQU1FMy4xMDBVVVVV//sQZP2B8WAWyGHpMxgBQBjANAABBKRPGweE0GgEgGNAsAAEahSJIAABlRIQMRTCiYxu5fI43BR06Vf2JaHyIb/////TJVFQSvWRXDMF2QUPVEEscUH5YOpMQU1FMy4xMDCqqqqqqqr/+zBk9YHxTBbGywwyEh6gGJA8AAAEUE8dJ4UwaASAY0CgAASoBpgADq6CQ4QaNUTBscDgq1KFf/1jsqyxgXVFQYVaJMejIDAAxoSJyvHwTpweyYRNPAewekxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmUEAAAVGkowV7AawigAAMwkllCuSDb/+yBk+4HxLhNIYeM0KBdAKKA0AAAEWE8bB4TQaCeAowCgAABqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//swZPWB8TwTRsHvMFgXwBigLAAAA/RPGyeIbOBLAKLAoAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sgZPiD8OgTSOHpEFgZYBigKAAAAdAdHQWkYKA0gGLAcAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7EGT4A/DbCsdJCRgoBYAo0BQAAAJUFx8EhSIgA4BjAGAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sQZPgB8KsCx0EjEAgAwBjwCAABA7QxGwSlICADAGOAIAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xBE6QfwVwJHQEYACgrgSOgEwAFAGAEYAAAAKAAAP8AAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==";
      audioEnabler.style="position: fixed; right: 0; top: 0; z-index: 100";
      audioEnabler.controls=true;
      $App.audioEnabler=audioEnabler;
      //root.appendChild(audioEnabler);
      if(this.setupData){
        this.setupApp(this.setupData);
      }
      if(this.showConsoleOnStart){
        this.console.setVisible(true);
      }
      this.onResize();
      if(window.onStart){
        var startFunc=async ()=>{
          if(!$App.debug.paused){  
            try{
              await window.onStart();
              $App.executedOnStart=true;
            }catch(e){
              $App.handleException(e);
            }
          }else{
            setTimeout(startFunc,100);
          }
        };
        if(window===window.top){
          startFunc();
        }else{
          setTimeout(startFunc,10);
        }
      }
      this.addMouseStateHandler(this.canvas.el);
      this.animationFrame=async ()=>{
        this.gamepad.updatePhysicalGamepad();
        if($App.executedOnStart && window.onNextFrame && !$App.debug.paused){
          try{
            await window.onNextFrame();
          }catch(e){
            $App.handleException(e);
          }
        }
        requestAnimationFrame(this.animationFrame);
      }
      requestAnimationFrame(this.animationFrame);
    }else{
      setTimeout(()=>{
        this.setup();
      },10);
    }
  }
  
  $App.setupApp=function(title,favicon,width,height,backgroundColor){
    if(!this.body.element){
      this.setupData={
        title: title,
        favicon: favicon,
        width: width,
        height: height,
        backgroundColor
      };
      return;
    }else{
      if(typeof title==="object"){
        favicon=title.favicon;
        width=title.width;
        height=title.height;
        backgroundColor=title.backgroundColor;
        title=title.title;
      }
    }
    if(title){
      var el=document.createElement("title");
      el.textContent=title;
      document.head.appendChild(el);
    }
    if(favicon){
      el=document.createElement("link");
      el.setAttribute("rel","icon");
      el.setAttribute("href","data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>"+favicon+"</text></svg>");
      document.head.appendChild(el);
    }
    if(!width) width=100;
    if(!height) height=100;
    if(!backgroundColor) backgroundColor="white";
    this.canvas.setSize(width,height,this.body.width,this.body.height);
    this.body.element.style.backgroundColor=backgroundColor;
  }
  
  $App.asyncFunctionCall=async function(object,methodname,argumentsArray){
    return await object[methodname].apply(object,argumentsArray);
  };
  
  $App.onResize=function(force){
    if(!$App.body.element){
      setTimeout($App.onResize,100);
      return;
    }
    var w = $App.body.right.clientWidth;
    var h = $App.body.right.clientHeight;
    if(w<=0 || h<=0){
      return;
    }
    if(force===true || w!=$App.body.width || h>$App.body.height){
      $App.body.width=w;
      $App.body.height=h;
      $App.canvas.resize(w,h);
    }else{
      $App.body.width=w;
      $App.body.height=h;
    }
  };
  window.onresize=function(e){
    $App.onResize();
  };
  
  window.onkeydown=function(ev){
    var k=ev.keyCode;
    var kb=$App.keyboard;
    kb.down[k]=true;
    if(kb.lastKeycodeDown!==k){
      kb.lastKeycodeDown=k;
      if($App.gamepad.element){
        var gp=$App.gamepad;
        gp.updateButtons(kb.down[gp.keycodes.A],kb.down[gp.keycodes.B], kb.down[gp.keycodes.X], kb.down[gp.keycodes.Y], kb.down[gp.keycodes.E], kb.down[gp.keycodes.F]);
        var button=gp.getMappedButton(k);
        if(button){
          if(button==="up" || button==="down" || button==="left" || button==="right"){
            gp.updateJoystickDirection(kb.down[gp.keycodes.left],kb.down[gp.keycodes.right],kb.down[gp.keycodes.up],kb.down[gp.keycodes.down]);
            button=null;
          }
          if(window.onGamepadDown){
            if($App.debug.paused) return;
            try{
              window.onGamepadDown(button);
            }catch(e){
              $App.handleException(e);
            }
          }
        }
      }
      if($App.debug.paused) return;
      if(window.onKeyDown){
        try{
          window.onKeyDown(k);
        }catch(e){
          $App.handleException(e);
        }
      }
    }
  };
  window.onkeyup=function(ev){
    var k=ev.keyCode;
    var kb=$App.keyboard;
    delete kb.down[k];
    kb.lastKeycodeDown=-1;
    if($App.gamepad.element){
      var gp=$App.gamepad;
      gp.updateButtons(kb.down[gp.keycodes.A],kb.down[gp.keycodes.B], kb.down[gp.keycodes.X], kb.down[gp.keycodes.Y], kb.down[gp.keycodes.E], kb.down[gp.keycodes.F]);
      var button=gp.getMappedButton(k);
      if(button){
        if(button==="up" || button==="down" || button==="left" || button==="right"){
          gp.updateJoystickDirection(kb.down[gp.keycodes.left],kb.down[gp.keycodes.right],kb.down[gp.keycodes.up],kb.down[gp.keycodes.down]);
          button=null;
        }
        if(window.onGamepadUp){
          if($App.debug.paused) return;
          try{
            window.onGamepadUp(button);
          }catch(e){
            $App.handleException(e);
          }
        }
      }
    }
    if($App.debug.paused) return;
    if(window.onKeyUp){
      try{
        window.onKeyUp(k);
      }catch(e){
        $App.handleException(e);
      }
    }
  };
  
  window.addEventListener("gamepadconnected", function(e) {
    $App.gamepad.connectPhysicalGamepad(e.gamepad);
  });
  
  window.addEventListener("gamepaddisconnected", function(e) {
    $App.gamepad.disconnectPhysicalGamepad();
  });
  
  $App.addMouseStateHandler=function(e){
    e.onmousedown=function(ev){
      $App.mouse.update(ev.clientX,ev.clientY,e,'down',ev.timeStamp);
      $App.mouse.down=true;
    };
    e.addEventListener("touchstart",function(ev){
      var t=ev.touches;
      if(!t) return;
      t=t[0];
      if(!t) return;
      $App.mouse.update(t.clientX,t.clientY,e,'down',ev.timeStamp,true);
      $App.mouse.down=true;
    });
    e.addEventListener("touchend",function(ev){
      var t=ev.touches;
      if(!t) return;
      t=t[0];
      if(!t) return;
      $App.mouse.update(t.clientX,t.clientY,e,'up',ev.timeStamp,true);
      $App.mouse.down=false;
    });
    e.onmouseup=function(ev){
      $App.mouse.update(ev.clientX,ev.clientY,e,'up',ev.timeStamp);
      $App.mouse.down=false;
    };
    e.addEventListener("touchmove",function(ev){
      var t=ev.touches;
      if(!t) return;
      t=t[0];
      if(!t) return;
      $App.mouse.update(t.clientX,t.clientY,e,'move',ev.timeStamp,true);
      $App.mouse.down=true;
    });
    e.onmousemove=function(ev){
      $App.mouse.update(ev.clientX,ev.clientY,e,'move',ev.timeStamp);
    };
  };
  
  $App.registerAsset=function(url, name){
    this.assets[name]={
      url: url
    }
  };

  $App.registerScript=function(url){
    this.scripts.push(url);
  }

  $App.getAsset=function(asset){
    if(!asset){
      var m="Dieses Asset konnte nicht geladen werden.";
      console.log(m);
      throw m;
    }
    if(asset.split){
      return this.getAssetByURL(asset);
    }else{
      if(asset.asset){
        return asset.asset;
      }else{
        return asset;
      }
    }
  }
  
  $App.getAssetByURL=function(url){
    if(!window.assets){
      let m="Du hast noch keine Assets registriert (loadAssets).";
      console.log(m);
      throw m;
    }
    url=url.toLowerCase();
    for(let i=0; i<this.assets.length; i++){
      let a=this.assets[i];
      if(a.url.toLowerCase()===url){
        return a.asset;
      }
    }
    let m="Es gibt kein Asset namens '"+url+"'.";
    console.log(m);
    throw m;
  }
  
  $App.loadScripts=async function(){
    for(var i=0;i<this.scripts.length;i++){
      var s=document.createElement("script");
      var url=this.scripts[i];
      
      var p=new Promise((resolve,reject)=>{
        s.onload=()=>{
          resolve();
        };
        s.onerror=()=>{
          resolve();
        };
        document.head.insertBefore(s,document.head.firstChild);
        s.src=url;
      });
      await p;
      
    }
  }

  $App.loadAssets=async function(){
    for(let a in this.assets){
      let asset=this.assets[a];
      let fullurl=(new URL(asset.url,document.baseURI)).href;
      let url=asset.url.toLowerCase();
      let p;
      let type=null;
      if(url.endsWith("mp3")||url.endsWith("wav")||url.endsWith("ogg")){
        continue;
        if(!this.audio.context){
          this.audio.context=new AudioContext();
        }
        let audio=document.createElement("audio");
        audio.style="position: fixed; left: 0; top: 0;z-index:100";
        audio.controls=true;
        document.body.appendChild(audio);
        audio.oncanplaythrough=()=>{
          type="audio";
          if(!location.protocol.startsWith("file")){
            let source=this.audio.context.createMediaElementSource(audio);
            let gainNode = this.audio.context.createGain();
            gainNode.value=1;
            //source.connect(gainNode);
            //gainNode.connect(this.audio.context.destination);
          }
          asset={
            audio: audio,
            //source: source,
            stop: function(){
              this.audio.pause();
              this.audio.currentTime=0;
            },
            pause: function(){
              this.audio.pause();
            },
            play: function(){
              this.audio.play();
            }
          }
          
        };
  
        // p=new Promise((resolve,reject)=>{
        //   audio.oncanplaythrough=()=>{
        //     type="sound";
        //     resolve(audio);
        //   };
        //   audio.onerror=()=>{
        //     resolve(null);
        //   };
        // });
        audio.src=fullurl;
  
        asset=audio;
      }else{
        let image=new Image();
        p=new Promise((resolve,reject)=>{
          image.onload=()=>{
            resolve(image);
          };
          image.onerror=()=>{
            resolve(null);
          };
        });
        image.src=fullurl;
        image=await p;
        if(image){
          asset.object=image;
          asset.type="image";
        }else{
          var m="Das Asset '"+url+"' konnte nicht geladen werden.";
        }
      }
    }
  };
  
  /**Canvas: */
  $App.Canvas=function Canvas(parent,width,height){
    this.container=document.createElement("div");
    this.el=document.createElement("canvas");
    this.el.jel=this;
    this.el.isCanvas=true;
    this.container.className="canvas-container";
    this.container.style.position="absolute";
    this.container.style.left=0;
    this.container.style.right=0;
    this.container.style.top=0;
    this.container.style.bottom=0;
    this.container.style.overflow="hidden";
    this.container.appendChild(this.el);
    this.el.style.position="absolute";
    this.el.style.left=0;
    this.el.style.top=0;
    this.el.style.width="100%";
    this.el.style.height="100%";
    this.width=width;
    this.height=height;
    this.pixelWidth=-1;
    this.pixelHeight=-1;
    this.dpr=window.devicePixelRatio||1;
    this.parent=parent;
    this.ctx=this.el.getContext("2d");
    this.commands=[];
    this.elements=[];
    var input=document.createElement("input");
    input.style.position="absolute";
    input.style.diplay="none";
    this.container.appendChild(input);
    this.input={
      element: input,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      align: ""
    };
    this.lastPoint={
      x: 0,
      y: 0
    };
    this.state={
      color: "black",
      lineWidth: 0.5,
      fontSize: 5,
      opacity: 1,
      font: 'monospace'
    };
    this.reset();
  };
  
  $App.Canvas.$getAlignment=function(align){
    var ha,va;
    if(align && align.toLowerCase){
      align=align.toLowerCase(); 
      if(align.indexOf("left")>=0){
        ha="right";
      }else if(align.indexOf("right")>=0){
        ha="left";
      }else{
        ha="center";
      }
      if(align.indexOf("bottom")>=0){
        va="top";
      }else if(align.indexOf("top")>=0){
        va="bottom";
      }else{
        va="middle";
      }
    }else{
      ha="center";
      va="middle";
    }
    return {
      h: ha, v: va
    };
  };

  $App.Canvas.prototype={
    save: function(dontAdd){
      if(!dontAdd){
        this.addCommand("save",[])
      }
      this.ctx.save();
    },
    restore: function(dontAdd){
      if(!dontAdd){
        this.addCommand("restore",[])
      }
      this.ctx.restore();
    },
    reset: function(){
      this.clear(true);
      this.lastPoint.x=0;
      this.lastPoint.y=0;
      this.setStroke(new $App.BasicStroke());
      this.setLinewidth(this.state.lineWidth,true);
      this.ctx.setTransform(1,0,0,1,0,0);
      this.setFontsize(this.state.fontSize,true);
      this.setFont(this.state.font);
      this.setColor(this.state.color,true);
      this.setOpacity(this.state.opacity,true);
    },
    rotate: function(theta,x,y,dontAdd){
      if(!dontAdd){
        this.addCommand("rotate",[theta,x,y]);
      }
      x=this.getX(x);
      y=this.getY(y);
      theta*=Math.PI/180;
      
      if(x===undefined){
        this.ctx.rotate(-theta);
      }else{
        this.ctx.translate(x,y);
        this.ctx.rotate(-theta);
        this.ctx.translate(-x,-y);
      }
    },
    translate: function(x,y,dontAdd){
      if(!dontAdd){
        this.addCommand("translate",[x,y]);
      }
      x=this.getWidth(x);
      y=this.getHeight(y);
      this.ctx.translate(x,-y);
    },
    shear: function(sx,sy){
  
    },
    scale: function(sx,sy,x,y,dontAdd){
      if(!dontAdd){
        this.addCommand("scale",[sx,sy,x,y]);
      }
      if(x===undefined){
        this.ctx.translate(0,this.height*this.dpr);
        this.ctx.scale(sx*1.0,sy*1.0);
        this.ctx.translate(0,-this.height*this.dpr);
      }else{
        x=this.getX(x);
        y=this.getY(y);
        this.ctx.translate(x,y);
        this.ctx.scale(sx,sy);
        this.ctx.translate(-x,-y);
      }
    },
    setTransform: function(m00,m10,m01,m11,m02,m12,dontAdd){
      if(!dontAdd){
        this.addCommand("setTransform",[m00,m10,m01,m11,m02,m12]);
      }
      this.ctx.setTransform(m00,m10,m01,m11,m02*this.dpr,m12*this.dpr);
    },
    redraw: function(){
      this.reset();
      for(var i=0;i<this.commands.length;i++){
        var c=this.commands[i];
        var f=this[c.cmd];
        f.apply(this,c.args);
      }
    },
    setSize: function(width,height,fullWidth,fullHeight){
      this.width=width;
      this.height=height;
      this.resize(fullWidth,fullHeight,true);
    },
    updateElementPosition: function(el,cx,cy,width,height,align){
      el.appJSData.cx=cx;
      el.appJSData.cy=cy;
      el.appJSData.width=width;
      el.appJSData.height=height;
      if(!align){
        align=$App.Canvas.$getAlignment("center");
      }
      el.appJSData.align=align;
      if(width===undefined){
        width=el.offsetWidth;
        width=this.getCanvasWidth(width);
      }
      if(height===undefined){
        height=el.offsetHeight;
        height=this.getCanvasHeight(height);
      }
      el.style.position="absolute";
      var x,y;
      if(align.h==="center"){
        x=cx-width/2;
      }else if(align.h==="left"){
        x=cx;
      }else{
        x=cx-width;
      }
      if(align.v==="middle"){
        y=cy-height/2;
      }else if(align.v==="top"){
        y=cy-height;
      }else{
        y=cy;
      }
      el.style.left=(100*(x))/(this.width)+"%";
      el.style.bottom=(100*(y))/(this.height)+"%";
      el.style.width=100*width/this.width+"%";
      el.style.height=100*height/this.height+"%";
    },
    addElement: function(el,cx,cy,width,height){
      this.container.appendChild(el);
      // cx=this.getX(cx);
      // cy=this.getY(cy);
      // if(width!==undefined){
      //   width=this.getWidth(width);
      // }
      // if(height!==undefined){
      //   height=this.getHeight(height);
      // }
      this.updateElementPosition(el,cx,cy,width,height);
      
    },
    resize: function(w,h,force){
      if(force || (w!==this.pixelWidth || h!==this.pixelHeight)){
        var left, right, bottom, top;
        left=0; right=0; top=0; bottom=0;
        if(w*this.height>=h*this.width){
          var s=h/this.height;
          var realW=this.width*s;
          left=(w-realW)/2;
          w=realW;
        }else{
          var s=w/this.width;
          var realH=this.height*s;
          top=(h-realH)/2;
          h=realH;
        }
        this.pixelWidth=w;
        this.pixelHeight=h;
        this.container.style.width=this.pixelWidth+"px";
        this.container.style.height=this.pixelHeight+"px";
        this.container.style.top=top+"px";
        this.container.style.left=left+"px";
        var w=Math.round(w*this.dpr);
        var h=Math.round(h*this.dpr);
        this.el.width=w;
        this.el.height=h;
        this.$adjustInputPosition();
        this.redraw();
      }
    },
    setColor: function(c,dontAdd){
      if(!dontAdd){
        this.addCommand("setColor",[c]);
      }
      this.color=c;
      this.state.color=c;
      this.ctx.strokeStyle=c;
      this.ctx.fillStyle=this.ctx.strokeStyle;
    },
    setOpacity: function(v,dontAdd){
      if(!dontAdd){
        this.addCommand("setOpacity",[v]);
      }
      this.state.opacity=v;
      this.ctx.globalAlpha=v;
    },
    setFontsize: function(size,dontAdd){
      this.state.fontSize=size;
      if(!dontAdd){
        this.addCommand("setFontsize",[size]);
      }
      this.ctx.font=this.getHeight(this.state.fontSize,true)+"px "+this.state.font;
    },
    setFont: function(name,dontAdd){
      this.state.font=name;
      if(!dontAdd){
        this.addCommand("setFont",[name]);
      }
      this.ctx.font=this.getHeight(this.state.fontSize,true)+"px "+this.state.font;
    },
    getPixelFontsize: function(){
      return parseFloat(this.ctx.font);
    },
    setLinewidth: function(lw,dontAdd){
      if(!dontAdd){
        this.addCommand("setLinewidth",[lw]);
      }
      this.state.lineWidth=lw;
      lw=this.getHeight(lw,true);
      this.ctx.lineWidth=lw;
    },
    setStroke: function(s){
      var a=["butt","round","square"];
      this.ctx.lineCap=a[s.$cap];
      a=["miter","round","bevel"];
      this.ctx.lineJoin=a[s.$join];
      var d=s.$dash_array;
      if(!d) d=[];
      this.ctx.setLineDash(d);
      /*TODO: Dash_Phase*/
    },
    clear: function(withoutCommands){
      this.el.width=this.el.width;
      this.setLinewidth(this.state.lineWidth,true);
      this.setFontsize(this.state.fontSize,true);
      this.setColor(this.state.color,true);
      if(!withoutCommands){
        this.commands=[];
      }
    },
    clearRect: function(x,y,w,h){
      this.ctx.clearRect(x*this.dpr,y*this.dpr,w*this.dpr,h*this.dpr);
    },
    drawArc: function(x, y, width, height, startAngle, arcAngle){
      if(startAngle===arcAngle) return;
      this.$createOval(x, y, width, height, startAngle, arcAngle);
      this.ctx.stroke();
    },
    fillArc: function(x, y, width, height, startAngle, arcAngle){
      if(startAngle===arcAngle) return;
      this.$createOval(x, y, width, height, startAngle, arcAngle);
      this.ctx.fill();
    },
    drawLine: function(x1,y1,x2,y2,dontAdd){
      if(!dontAdd){
        this.addCommand("drawLine",[x1,y1,x2,y2]);
      }
      x1=this.getX(x1);
      y1=this.getY(y1);
      x2=this.getX(x2);
      y2=this.getY(y2);
      this.ctx.beginPath();
      this.ctx.moveTo(x1,y1);
      this.ctx.lineTo(x2,y2);
      this.ctx.stroke();
    },
    beginPath: function(x,y,dontAdd){
      if(!dontAdd){
        this.addCommand("beginPath",[x,y]);
      }
      x=this.getX(x);
      y=this.getY(y);
      this.lastPoint.x=x;
      this.lastPoint.y=y;
      this.ctx.beginPath();
      this.ctx.moveTo(x,y);
    },
    jump: function(dx,dy,dontAdd){
      if(!dontAdd){
        this.addCommand("jump",[dx,dy]);
      }
      dx=this.getWidth(dx);
      dy=this.getHeight(dy);
      this.lastPoint.x+=dx;
      this.lastPoint.y-=dy;
      this.ctx.moveTo(this.lastPoint.x,this.lastPoint.y);
    },
    jumpTo: function(x,y,dontAdd){
      if(!dontAdd){
        this.addCommand("jumpTo",[x,y]);
      }
      x=this.getX(x);
      y=this.getY(y);
      this.lastPoint.x=x;
      this.lastPoint.y=y;
      this.ctx.moveTo(this.lastPoint.x,this.lastPoint.y);
    },
    rect: function(w,h,dontAdd){
      if(!dontAdd){
        this.addCommand("rect",[w,h]);
      }
      w=this.getWidth(w);
      h=this.getHeight(h);
      let x=this.lastPoint.x;
      let y=this.lastPoint.y;
      this.ctx.moveTo(x-w/2,y-h/2);
      this.ctx.lineTo(x+w/2,y-h/2);
      this.ctx.lineTo(x+w/2,y+h/2);
      this.ctx.lineTo(x-w/2,y+h/2);
      this.ctx.closePath();
    },
    circle: function(r,start,stop,dontAdd){
      if(!dontAdd){
        if(start===undefined){
          start=0;
        }
        if(stop===undefined){
          stop=360;
        }
        this.addCommand("circle",[r,start,stop]);
      }
      r=this.getWidth(r);
      let cx=this.lastPoint.x;
      let cy=this.lastPoint.y;
      let counterclockwise=start<=stop;
  
      this.ctx.arc(cx,cy,r,-start*Math.PI/180,-stop*Math.PI/180,counterclockwise);
    },
    line: function(dx,dy,dontAdd){
      if(!dontAdd){
        this.addCommand("line",[dx,dy]);
      }
      dx=this.getWidth(dx);
      dy=this.getHeight(dy);
      this.lastPoint.x+=dx;
      this.lastPoint.y-=dy;
      this.ctx.lineTo(this.lastPoint.x,this.lastPoint.y);
    },
    arcTo: function(x1,y1,x2,y2,r){
      this.ctx.arcTo(x1*this.dpr,y1*this.dpr,x2*this.dpr,y2*this.dpr,r*this.dpr);
    },
    closePath: function(dontAdd){
      if(!dontAdd){
        this.addCommand("closePath",[]);
      }
      this.ctx.closePath();
    },
    drawPath: function(dontAdd){
      if(!dontAdd){
        this.addCommand("drawPath",[]);
      }
      this.ctx.stroke();
    },
    fillPath: function(dontAdd){
      if(!dontAdd){
        this.addCommand("fillPath",[]);
      }
      this.ctx.fill();
    },
    isPointInPath: function(x,y){
      return this.ctx.isPointInPath(this.getX(x),this.getY(y));
    },
    write: function(text,x,y,align,dontAdd){
      if(!dontAdd){
        align=$App.Canvas.$getAlignment(align);
        this.addCommand("write",[text,x,y,align]);
      }
      x=this.getX(x);
      y=this.getY(y);
      if(text.split){
        var lines=text.split("\n");
      }else{
        var lines=[text+""]
      }
      var lineHeight=this.getPixelFontsize();
      this.ctx.textAlign=align.h;
      this.ctx.textBaseline=align.v;
      
      if(align.v==="bottom"){
        y-=lineHeight*(lines.length-1);  
      }else if(align.v==="middle"){
        y-=lineHeight*((lines.length-1)/2);
      } 
      for(var i=0;i<lines.length;i++){
        this.ctx.fillText(lines[i],x,y);
        y+=lineHeight;
      }
    },
    $adjustInputPosition: function(){
      var x=this.getRawX(this.input.x);
      var y=this.getRawY(this.input.y);
      var width=this.getRawWidth(this.input.width);
      var height=this.input.height;
      var align=this.input.align;
      align=$App.Canvas.$getAlignment(align);
      this.input.element.style.textAlign="left";
      if(align.h==="center"){
        x-=width/2;
        this.input.element.style.textAlign="center";
      }else if(align.h==="right"){
        x-=width;
      }
      if(align.v==="middle"){
        y-=height/2;
      }else if(align.v==="bottom"){
        y-=height;
      }
      this.input.element.style.left=x+"px";
      this.input.element.style.top=y+"px";
      this.input.element.style.width=width+"px";
      this.input.element.style.height=height+"px";
    },
    read: async function(placeholdertext,x,y,width,align,inputtype){
      this.input.x=x;
      this.input.y=y;
      this.input.width=width;
      this.input.height=this.getPixelFontsize();
      this.input.align=align;
      this.$adjustInputPosition();
      this.input.element.placeholder=placeholdertext;
      this.input.element.type=inputtype;
      this.input.element.style.display="";
      var p=new Promise((resolve,reject)=>{
        this.input.element.onchange=()=>{
          this.input.element.style.display="none";
          var v=this.input.element.value;
          this.input.element.value="";
          resolve(v);
        }
      });
      var q=await p;
      if(inputtype==="number"){
        q=parseFloat(q);
      }
      return q;
    },
    drawImage: function(image,cx,cy,w,h,angle,mirrored,sourceRect,dontAdd){
      if(!image) return;
      if(!dontAdd){
        angle*=Math.PI/180;
        this.addCommand('drawImage',[image,cx,cy,w,h,angle,mirrored,sourceRect]);
      }
      cx=this.getX(cx);
      cy=this.getY(cy);
      w=this.getWidth(w);
      h=this.getHeight(h);
      this.ctx.save();
      this.ctx.translate(cx,cy);
      if(mirrored){
        this.ctx.scale(-1,1);
      }
      if(angle){
        this.ctx.rotate(-angle);
      }
      if(image.object){
        image=image.object;
      }else if(image.substring){
        var asset=$App.assets[image];
        if(!asset){
          var m="Es gibt kein Bild namens '"+image+"'. Du musst es vorher mittels loadAsset laden.";
          console.log(m);
          throw m;
        }
        image=asset.object;
      }
      if(sourceRect){
        this.ctx.drawImage(image,image.width/2+sourceRect.cx-sourceRect.w/2,image.height/2+sourceRect.cy-sourceRect.h/2,sourceRect.w,sourceRect.h,-w/2,-h/2,w,h);
      }else{
        this.ctx.drawImage(image,-w/2,-h/2,w,h);
      }
      this.ctx.restore();
    },
    getImageBase64: function(){
      return this.el.toDataURL("image/png");
    },
    paintRect: function(x,y,w,h,fill,dontAdd){
      if(!dontAdd){
        this.addCommand("paintRect",[x,y,w,h,fill]);
      }
      var obj={
        cx: x,
        cy: y,
        w: w,
        h: h,
        contains: function(x,y){
          return (x>=this.cx-this.w/2 && x<=this.cx+this.w/2 && y>=this.cy-this.h/2 && y<=this.cy+this.h/2);
        },
        draw: function(){
          $App.canvas.paintRect(this.cx,this.cy,this.w,this.h,false)
        },
        fill: function(){
          $App.canvas.paintRect(this.cx,this.cy,this.w,this.h,true)
        }
      };
      x=this.getX(x);
      y=this.getY(y);
      w=this.getWidth(w);
      h=this.getHeight(h);
      if(fill){
        this.ctx.fillRect(x-w/2,y-h/2,w,h);
      }else{
        this.ctx.strokeRect(x-w/2,y-h/2,w,h);
      }
      return obj;
    },
    paintCircle: function(cx,cy,r,fill,dontAdd){
      if(!dontAdd){
        this.addCommand("paintCircle",[cx,cy,r,fill]);
      }
      var obj={
        cx: cx,
        cy: cy,
        r: r,
        contains: function(x,y){
          return ((this.cx-x)*(this.cx-x)+(this.cy-y)*(this.cy-y)<=this.r*this.r);
        },
        draw: function(){
          $App.canvas.paintCircle(this.cx,this.cy,this.r,false)
        },
        fill: function(){
          $App.canvas.paintCircle(this.cx,this.cy,this.r,true)
        }
      };
      cx=this.getX(cx);
      cy=this.getY(cy);
      r=this.getWidth(r);
      this.ctx.beginPath();
      this.ctx.arc(cx,cy,r,0,2*Math.PI);
      if(fill){
        this.ctx.fill();
      }else{
        this.ctx.stroke();
      }
      return obj;
    },
    addCommand: function(cmd,args){
      args.push(true);
      this.commands.push({
        cmd: cmd,
        args: args
      });
    },
    getCanvasX: function(x){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (x-(this.pixelWidth-s*this.width)/2)/(s);
      }else{
        var s=this.pixelWidth/this.width;
        return x/(s);
      }
    },
    getCanvasY: function(y){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return -(y-this.pixelHeight)/s;
      }else{
        var s=this.pixelWidth/this.width;
        return (-(y-this.pixelHeight)-(this.pixelHeight-s*this.height)/2)/s;
      }
    },
    getCanvasWidth: function(w){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (w/s);
      }else{
        var s=this.pixelWidth/this.width;
        return (w/s);
      }
    },
    getCanvasHeight: function(h){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (h/s);
      }else{
        var s=this.pixelWidth/this.width;
        return (h/s);
      }
    },
    getRawX: function(x){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (s*(x+0)+(this.pixelWidth-s*this.width)/2);
      }else{
        var s=this.pixelWidth/this.width;
        return (s*(x+0));
      }
    },
    getRawY: function(y){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (this.pixelHeight-s*(y+0));
      }else{
        var s=this.pixelWidth/this.width;
        return (this.pixelHeight-(s*(y+0)+(this.pixelHeight-s*this.height)/2));
      }
    },
    getRawWidth: function(w){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (s*w);
      }else{
        var s=this.pixelWidth/this.width;
        return (s*w);
      }
    },
    getRawHeight: function(h){
      if(this.pixelWidth*this.height>=this.pixelHeight*this.width){
        var s=this.pixelHeight/this.height;
        return (s*h);
      }else{
        var s=this.pixelWidth/this.width;
        return (s*h);
      }
    },
    getX: function(x,dontRound){
      x=this.getRawX(x)*this.dpr;
      if(!dontRound){
        x=Math.round(x);
      }
      return x;
    },
    getY: function(y,dontRound){
      y=this.getRawY(y)*this.dpr;
      if(!dontRound){
        y=Math.round(y);
      }
      return y;
    },
    getWidth: function(w,dontRound){
      w=this.getRawWidth(w)*this.dpr;
      if(!dontRound){
        w=Math.round(w);
      }
      return w;
    },
    getHeight: function(h,dontRound){
      h=this.getRawHeight(h)*this.dpr;
      if(!dontRound){
        h=Math.round(h);
      }
      return h;
    },
    paintOval: function(x,y,w,h,fill,dontAdd){
      if(!dontAdd){
        this.addCommand("paintOval",[x,y,w,h,fill]);  
      }
      x=this.getX(x);
      y=this.getY(y);
      w=this.getWidth(w);
      h=this.getHeight(h);
      this.$createOval(x,y,w,h);
      this.ctx.closePath();
      if(fill){
        this.ctx.fill();
      }else{
        this.ctx.stroke();
      }
    },
    $createOval: function(x,y,w,h,start,stop,dontAdd){
      var c=this.ctx;
      var rx=w/2;
      var ry=h/2;
      var cx=x;
      var cy=y;
      c.beginPath();
      if(!start) start=0;
      if(!stop) stop=360;
      if(start>stop){
        var c=Math.ceil((start-stop)/360);
        stop+=c*360;
      }
      if(stop-start>360){
        start=0;
        stop=360;
      }
      a=start*2*Math.PI;
      c.moveTo((cx+Math.cos(a)*rx),(cy-Math.sin(a)*ry));
      for(var i=start;i<=stop;i++){
        var a=i/180*Math.PI;
        c.lineTo((cx+Math.cos(a)*rx),(cy-Math.sin(a)*ry));
      }
      if(start===stop){
        c.closePath();
      }
    }
  };
  
  $App.BasicStroke=function BasicStroke( width, cap, join, miterlimit, dash, dash_phase){
    if(!width) width=1;
    if(!cap) cap=$App.BasicStroke.CAP_BUTT;
    if(!join) join=$App.BasicStroke.JOIN_MITER;
    if(!miterlimit) miterlimit=1;
    if(!dash) dash=null;
    if(!dash_phase) dash_phase=0;
    this.$width=width;
    this.$cap=cap;
    this.$join=join;
    this.$miterlimit=miterlimit;
    this.dash=dash;
    this.dash_phase=dash_phase;
  };
  $App.BasicStroke.CAP_BUTT=0;
  $App.BasicStroke.CAP_ROUND=1;
  $App.BasicStroke.CAP_SQUARE=2;
  $App.BasicStroke.JOIN_BEVEL=2;
  $App.BasicStroke.JOIN_MITER=0;
  $App.BasicStroke.JOIN_ROUND=1;
  
  $App.BasicStroke.prototype={
    set: function(stroke){
      this.$width=stroke.$width;
      this.$cap=stroke.$cap;
      this.$join=stroke.$join;
      this.$miterlimit=stroke.$miterlimit;
      this.dash=stroke.dash;
      this.dash_phase=stroke.dash_phase;
    },
    getDashArray: function(){
      return this.$dash;
    },
    getDashPhase: function(){
      return this.$dash_phase
    },
    getEndCap: function(){
      return this.$cap;
    },
    getLineJoin: function(){
      return this.$join;
    },
    getLineWidth: function(){
      return this.$width;
    },
    getMiterLimit: function(){
      return this.$miterlimit;
    }
  };
  

  /**World */
  $App.World=function(canvas){
    this.canvas=canvas;
    this.zoom=1;
    this.cx=0;
    this.cy=0;
    this.width=0;
    this.height=0;
    this.mouse={
      x: -1,
      y: -1,
    }
  };

  $App.World.prototype={
    addRow: function(description){
      if(this.height===0){
        this.create(0,0);
      }
      this.height++;
      var cells=[];
      var val=null;
      var x=1;
      var y=this.tiles.length+1;
      var l=description;
      for(var j=0;j<l.length;j++){
        var tile={
          x: x,
          y: y,
          info: null
        };
        var c=l.charAt(j);
        if(c==="("){
          val="";
          var tile={
            x: x,
            y: y,
            info: null
          };
        }else if(c===")"){
          tile.type=val;
          cells.push(tile);
          val=null;
        }else{
          if(val===null){
            tile.type=c;
            cells.push(tile);
          }else{
            val+=c;
          }
        }
        x++;
      }
      if(this.height>1 && cells.length!==this.width){
        throw "addRow: '"+description+"' definiert "+cells.length+" Felder, die Welt hat aber "+this.width+" Felder!";
      }
      this.tiles.push(cells);
      if(cells.length>this.width){
        this.width=cells.length;
      }
      this.cx=(1+this.width)/2;
      this.cy=(1+this.height)/2;
      this.calcLayout();
      return cells;
    },
    create: function(width,height){
      this.tiles=[];
      var y=1;
      for(var i=0;i<height;i++){
        var cells=[];
        var x=1;
        for(var j=0;j<width;j++){
          var tile={
            x: x,
            y: y,
            info: null,
            type: " "
          };
          cells.push(tile);
          x++;
        }
        this.tiles.push(cells);
        y++;
      }
      this.width=width;
      this.height=height;
      this.cx=(1+this.width)/2;
      this.cy=(1+this.height)/2;
      this.calcLayout();
    },
    setup: function(description){
      this.width=0;
      this.height=0;
      if(!description || !description.substring){
        var m="setup: Die Beschreibung ist kein String";
        throw m;
      }
      var lines=description.split("\n");
      this.height=lines.length;
      this.tiles=[];
      for(var i=0;i<lines.length;i++){
        var l=lines[i].trim();
        this.addRow(l);
      }
      this.cx=(1+this.width)/2;
      this.cy=(1+this.height)/2;
      this.zoom=1;
      this.calcLayout();
    },
    replaceTypes: function(oldType,newType){
      this.forAllTiles((t)=>{
        if(t.type===oldType){
          t.type=newType;
        }
      });
    },
    forAllTiles: function(f){
      if(this.width*this.height===0){
        return;
      }
      for(var i=0;i<this.tiles.length;i++){
        for(var j=0;j<this.tiles[0].length;j++){
          var t=this.tiles[i][j];
          if(t){
            f(t);
          }
        }
      }
    },
    drawAsync: async function(){
      for(var i=0;i<this.tiles.length;i++){
        var row=this.tiles[i];
        for(var j=0;j<row.length;j++){
          var t=row[j];
          var x=j+1;
          var y=i+1;
          var tile=this.getTile(x,y);
          if(window.onTileDraw){
            await window.onTileDraw(x,y,tile.type,tile.info);
          }else{
            this.paintRect(x,y,1,1,false);
            this.write(tile.type,x,y);
          }
        }
      }
    },
    draw: function(){
      for(var i=0;i<this.tiles.length;i++){
        var row=this.tiles[i];
        for(var j=0;j<row.length;j++){
          var t=row[j];
          var x=j+1;
          var y=i+1;
          var tile=this.getTile(x,y);
          if(window.onTileDraw){
            window.onTileDraw(x,y,tile.type,tile.info);
          }else{
            this.paintRect(x,y,1,1,false);
            this.write(tile.type,x,y);
          }
        }
      }
    },
    calcLayout: function(){
      this.offsetX=0;
      this.offsetY=0;
      this.screenWidth=0;
      this.screenHeight=0;
      this.scaleFactor=1;
      if(this.width*this.height===0){
        return;
      }
      if(this.width*this.canvas.height>=this.height*this.canvas.width){
        var f=this.canvas.width/this.width;
        this.offsetY=(this.canvas.height-this.height*f)/2;
      }else{
        var f=this.canvas.height/this.height;
        this.offsetX=(this.canvas.width-this.width*f)/2;
      }
      this.scaleFactor=f;
      var f=this.scaleFactor*this.zoom;
      var sw=f*this.width;
      var sh=f*this.height;
      this.offsetX=this.cx*f-sw;
      this.offsetY=this.cy*f-sh;
      this.screenWidth=sw,
      this.screenHeight=sh;
    },
    getWorldBounds(sx,sy,sw,sh){
      /**berechnet das entsprechende Rechteck in der Spielwelt, umkehrung von getScreenBounds*/
      var dx=(sx-this.canvas.width/2)/(this.zoom*this.scaleFactor);
      var dy=(sy-this.canvas.height/2)/(this.zoom*this.scaleFactor);
      var x=dx+this.cx;
      var y=dy+this.cy;
      var w=sw/(this.zoom*this.scaleFactor);
      var h=sh/(this.zoom*this.scaleFactor);
      return {
        x: x,
        y: y,
        w: w,
        h: h
      };
    },
    getScreenBounds: function(x,y,w,h){
      var sx,sy,sw,sh;
      var dx=x-this.cx;
      var dy=y-this.cy;
      var sx=this.canvas.width/2+dx*this.zoom*this.scaleFactor;
      var sy=this.canvas.height/2+dy*this.zoom*this.scaleFactor;
      sw=w*this.zoom*this.scaleFactor;
      sh=h*this.zoom*this.scaleFactor;
      return {
        x: sx,
        y: sy,
        w: sw,
        h: sh
      };
    },
    getTiles: function(type){
      var tiles=[];
      if(this.width*this.height===0){
        return tiles;
      }
      for(var i=0;i<this.tiles.length;i++){
        for(var j=0;j<this.tiles[0].length;j++){
          var t=this.tiles[i][j];
          if(t && t.type===type){
            tiles.push(t);
          }
        }
      }
      return tiles;
    },
    getTile: function(x,y){
      var c=Math.floor(x-0.5);
      var r=Math.floor(y-0.5);
      r=this.tiles.length-1-r;
      if(r<0 || r>= this.tiles.length || c<0 || c>=this.tiles[r].length){
        return null;
      }
      return this.tiles[r][c];
    },
    setCenter(cx,cy){
      this.cx=cx;
      this.cy=cy;
      this.calcLayout();
    },
    setZoom(factor){
      this.zoom=factor;
      this.calcLayout;
    },
    write: function(text,x,y,align){
      var bounds=this.getScreenBounds(x,y,1,1);
      write(text,bounds.x,bounds.y,align);
    },
    paintRect: function(x,y,w,h,fill){
      var bounds=this.getScreenBounds(x,y,w,h);
      $App.canvas.paintRect(bounds.x,bounds.y,bounds.w,bounds.h,fill);
    },
    paintCircle(cx,cy,r,fill){
      var bounds=this.getScreenBounds(cx,cy,r,r);
      $App.canvas.paintCircle(bounds.x,bounds.y,bounds.w,fill);
    },
    drawImage: function(asset,x,y,w,h,rotation,mirrored,sx,sy,sw,sh){
      var bounds=this.getScreenBounds(x,y,w,h);
      if(sx!==undefined && sy!==undefined && sw!==undefined && sh!==undefined){
        drawImagePart(asset,bounds.x,bounds.y,bounds.w,bounds.h,sx,sy,sw,sh,rotation,mirrored);
      }else{
        drawImage(asset,bounds.x,bounds.y,bounds.w,bounds.h,rotation,mirrored);
      }
      
    },
    getType: function(x,y){
      var tile=this.getTile(x,y);
      if(tile){
        return tile.type;
      }else{
        return null;
      }
    },
    setType: function(x,y,newType){
      var tile=this.getTile(x,y);
      if(tile){
        tile.type=newType
      }
    },
    setInfo: function(x,y,newInfo){
      var tile=this.getTile(x,y);
      if(tile){
        tile.info=newInfo
      }
    },
    getInfo: function(x,y){
      var tile=this.getTile(x,y);
      if(tile){
        return tile.info;
      }else{
        return null;
      }
    }
  };


  /**Gamepad: */
  $App.Gamepad=function(){
    this.element=null;
    this.multiaxis=true;
    this.buttons={
      A: null, B: null, X: null, Y: null, E: null, F: null
    };
    this.joystick=null;
    this.keycodes={
      left: 37,
      right: 39,
      down: 40,
      up: 38,
      A: 65,
      B: 66,
      E: 69,
      F: 70,
      X: 88,
      Y: 89
    };
    this.physicalButtons={
      buttons: {
        A: {index: 0, down: false},
        B: {index: 1, down: false},
        E: {index: 9, down: false},
        F: {index: 8, down: false},
        X: {index: 2, down: false},
        Y: {index: 3, down: false},
      },
      dirs: {
        left: {axis: 0, low: true, down: false},
        right: {axis: 0, low: false, down: false},
        up: {axis: 1, low: true, down: false},
        down: {axis: 1, low: false, down: false}
      }
    };
    //[{index: 1, name: "A"},{index: 2,name: "B"},{index: 0,name: "X"},{index: 3,name: "Y"},{index: 9,name: "E"},{index:8,name:"F"}];
    this.connectedGamepadIndex=-1;
  };  
  
  $App.Gamepad.prototype={
    updateButtons: function(ADown,BDown,XDown,YDown,EDown,FDown){
      var down={
        A: ADown, B: BDown, X: XDown, Y: YDown, E: EDown, F: FDown
      };
      for(var a in this.buttons){
        var b=this.buttons[a];
        if(down[a]){
          b.el.style.opacity="0.5";
        }else{
          b.el.style.opacity="1";
        }
      }
    },
    updateJoystickDirection: function(leftDown,rightDown,upDown,downDown){
      var dir=undefined;
      if(upDown && !downDown){
        dir="N";
      }
      if(!upDown && downDown){
        dir="S";
      }
      if(!dir || this.multiaxis){
        if(!dir) dir="";
        if(leftDown && !rightDown){
          dir+="W";
        }
        if(!leftDown && rightDown){
          dir+="E";
        }
      }
      this.joystick.setDir(dir);
    },
    getMappedButton: function(keycode){
      for(var a in this.keycodes){
        if(this.keycodes[a]===keycode){
          return a;
        }
      }
      return null;
    },
    isButtonPressed: function(button){
      if(this.connectedGamepadIndex>=0){
        let buttonState=this.physicalButtons.buttons[button];
        if(buttonState!==undefined){
          return buttonState.down;
        }
        buttonState=this.physicalButtons.dirs[button];
        if(!this.multiaxis && buttonState.axis===0 && (this.physicalButtons.dirs.up.down||this.physicalButtons.dirs.down.down)){
          return false;
        }
        return buttonState.down;
      }else{
        if($App.keyboard.down[this.keycodes[button]]){
          if(!this.multiaxis){
            if(button==="left"||button==="right"){
              if($App.keyboard.down[this.keycodes["Up"]] || $App.keyboard.down[this.keycodes["Down"]]){
                return false;
              }
            }
          }
          return true;
        }
        var b=this.buttons[button];
        if(b){
          return b.down;
        }
        var x=this.joystick.GetX();
        var y=this.joystick.GetY();
        var threshold=40;
        if(!this.multiaxis){
          /*wenn multiaxis false ist, dann wird nur die beste Richtung gewertet*/
          var bestDir=null;
          var bestDirValue;
          if(Math.abs(x)>Math.abs(y)){
            bestDir=x>0? "right": "left";
            bestDirValue=x;
          }else{
            bestDir=y>0? "up": "down";
            bestDirValue=y;
          }
          return button===bestDir && Math.abs(bestDirValue)>threshold;
        }
        if(button==="left"){
          return (x<-threshold);
        }
        if(button==="right"){
          return (x>threshold);
        }
        if(button==="up"){
          return (y>threshold);
        }
        if(button==="down"){
          return (y<-threshold);
        }
      }
    },
    setButtonKey: function(button,key){
      let b=this.buttons[button];
      if(b){
        if(!key){
          b.el.style.display="none";
          this.keycodes[button]=null;
          return;
        }else{
          b.el.style.display="inline-block";
        }
      }
      if(typeof key==="string"){
        key=key.codePointAt(0);
      }
      this.keycodes[button]=key;
    },
    setVisible: function(v){
      if(v){
        this.create();
      }
      v=v? "inline-block":"none";
      this.joystick.element.style.display=v;
      for(let a in this.buttons){
        if(this.keycodes[a]!==null){
          let b=this.buttons[a];
          b.el.style.display=v;
        }
      }
    },
    connectPhysicalGamepad: function(gp){
      this.connectedGamepadIndex=gp.index;
    },
    disconnectPhysicalGamepad: function(){
      this.connectedGamepadIndex=-1;
    },
    updatePhysicalGamepad: function(){
      if(this.connectedGamepadIndex<0){
        return;
      }
      let gp=navigator.getGamepads()[this.connectedGamepadIndex];
      for(let a in this.physicalButtons.buttons){
        let buttonState=this.physicalButtons.buttons[a];
        let button=gp.buttons[buttonState.index];
        let v;
        if(typeof button==="number"){
          v=button>0.5;
        }else{
          v=button.pressed;
        }
        if(!$App.debug.paused && v && !buttonState.down && window.onGamepadDown){
          try{
            window.onGamepadDown(a);
          }catch(e){
            $App.handleException(e);
          }
        }else if(!$App.debug.paused && !v && buttonState.down && window.onGamepadUp){
          try{
            window.onGamepadUp(a);
          }catch(e){
            $App.handleException(e);
          }
        }
        buttonState.down=v;
      }
      for(let a in this.physicalButtons.dirs){
        let buttonState=this.physicalButtons.dirs[a];
        let axis=gp.axes[buttonState.axis];
        let v;
        if(buttonState.low){
          v=axis<-0.2;
        }else{
          v=axis>0.2;
        }
        if(!$App.debug.paused && v && !buttonState.down && window.onGamepadDown){
          try{
            window.onGamepadDown(a);
          }catch(e){
            $App.handleException(e);
          }
        }else if(!$App.debug.paused && !v && buttonState.down && window.onGamepadUp){
          try{
            window.onGamepadUp(a);
          }catch(e){
            $App.handleException(e);
          }
        }
        buttonState.down=v;
      }
    },
    create: function(){
      if(this.element) return;
      var div=document.createElement("div");
      this.element=div;
      div.style="position: absolute; left: 0.5cm; bottom: 0.5cm; width: 2cm; height: 2cm; z-index: 10;";
      div.onmouseleave=function(){
  
      };
      $App.body.root.appendChild(div);
      for(var a in this.buttons){
        let b=this.buttons[a];
        b=document.createElement("div");
        b.style="font-family: sans-serif;font-weight:bold;border-radius: 2000px; width: 1cm; height: 1cm; position: absolute; z-index: 10; border: 1pt solid black;text-align: center; line-height: 1cm; user-select: none;cursor: pointer;opacity: 1";
        b.className="gamepad-button";
        b.textContent=a;
        this.buttons[a]={
          el: b,
          name: a,
          down: false
        };
        b.button=this.buttons[a];
        b.onmousedown=function(ev){
          if(ev) ev.preventDefault();
          $App.mouse.down=true;
          this.button.down=true;
          this.button.el.style.opacity="0.5";
          if(!$App.debug.paused && window.onGamepadDown){
            try{
              window.onGamepadDown(this.button.name);
            }catch(e){
              $App.handleException(e);
            }
          }
        };
        b.onmouseup=function(ev){
          if(ev) ev.preventDefault();
          $App.mouse.down=false;
          this.button.down=false;
          this.button.el.style.opacity="1";
          if(!$App.debug.paused && window.onGamepadUp){
            try{
              window.onGamepadUp(this.button.name);
            }catch(e){
              $App.handleException(e);
            }
          }
        };
        b.addEventListener("touchstart",b.onmousedown);
        b.addEventListener("touchend",b.onmouseup);
        b.onmouseover=function(ev){
          if(ev) ev.preventDefault();
          if($App.mouse.down){
            this.onmousedown();
          }
        },
        b.onmouseout=function(ev){
          if(ev) ev.preventDefault();
          if(this.button.down){
            this.button.down=false;
            this.button.el.style.opacity="1";
            if(!$App.debug.paused && window.onGamepadUp){
              try{
                window.onGamepadUp(this.button.name);
              }catch(e){
                $App.handleException(e);
              }
            }
          }
        };
        document.body.addEventListener('touchmove', (ev)=>{
          for(let i=0;i<ev.touches.length;i++){
            var touch = ev.touches[i];
            var touches=b===document.elementFromPoint(touch.pageX,touch.pageY);
            if(touches) break; 
          }
          if(b.button.down){
            if(!touches){
              b.onmouseout();
            }
          }else{
            if(touches){
              b.onmousedown();
            }
          }
        }, false);
        $App.body.root.appendChild(b);
      }
      this.joystick=new $App.$JoyStick(div,function(){
        if(!$App.debug.paused && window.onGamepadDown){
          try{
            window.onGamepadDown(null);
          }catch(e){
            $App.handleException(e);
          }
        }
      }, function(){
        if(!$App.debug.paused && window.onGamepadUp){
          try{
            window.onGamepadUp(null);
          }catch(e){
            $App.handleException(e);
          }
        }
      });
      this.joystick.element=div;
      this.buttons.A.el.style.right="0.1cm";
      this.buttons.A.el.style.bottom="0.75cm";
      this.buttons.A.el.style.backgroundColor="red";
      this.buttons.B.el.style.right="1.25cm";
      this.buttons.B.el.style.bottom="0.5cm";
      this.buttons.B.el.style.backgroundColor="yellow";
      this.buttons.X.el.style.right="0.1cm";
      this.buttons.X.el.style.bottom="2cm";
      this.buttons.X.el.style.backgroundColor="blue";
      this.buttons.X.el.style.color="white";
      this.buttons.Y.el.style.right="1.25cm";
      this.buttons.Y.el.style.bottom="1.75cm";
      this.buttons.Y.el.style.backgroundColor="lime";
      this.buttons.E.el.style.right="0.1cm";
      this.buttons.E.el.style.bottom="3.25cm";
      this.buttons.E.el.style.backgroundColor="magenta";
      this.buttons.F.el.style.right="1.25cm";
      this.buttons.F.el.style.bottom="3cm";
      this.buttons.F.el.style.backgroundColor="cyan";
    }
  }
  $App.gamepad=new $App.Gamepad()
  
  /*****Array */
  $App.Array=function(type, dim){
    this.type=type;
    this.dim=dim;
    this.values=$App.Array.createArrayValues(type,null,dim,0);
  };

  $App.Array.prototype={
    get length(){
      return this.dim[0];
    },
    checkBounds: function(index){
      if(index>=this.length || index<0){
        var m="Index "+index+" liegt außerhalb der Array-Grenzen von 0 bis "+(this.length-1);
        console.error(m);
        throw m;
      }
    },
    get: function(index){
      this.checkBounds(index);
      return this.values[index];//this.privateGet(index,this.values,0);
    },
    set: function(index,value){
      this.checkBounds(index);
      this.values[index]=value;
    }
  };

  $App.Array.createArrayValues=function(type,value,dim){
    if(dim.length===1){
      var array=[];
      for(var i=0;i<dim[0];i++){
        array.push(value);
      }
      return array;
    }else{
      var array=[];
      var newDim=[];
      for(let i=1;i<dim.length;i++){
        newDim.push(dim[i]);
      }
      for(var i=0;i<dim[0];i++){
        var subArray=new $App.Array(type, newDim);
        array.push(subArray);
      }
      return array;
    }
  }

  /**Toast */
  $App.Toast=function(container){
    this.container=container;
  };
  
  $App.Toast.prototype={
    show: function(text,pos,duration){
      let element=document.createElement("span");
      element.style="color: white; background-color: #121212; transition: opacity 1s; padding: 0.5rem; border-radius: 10px";
      element.style.opacity="0";
      if(!duration){
        duration=Math.min(Math.max(1500,text.length*200),15000);
      }
      element.innerHTML=text;
      if(!pos){
        pos="center";
      }
      if(pos.indexOf("left")>=0){
        element.style.justifySelf="start";
        element.style.gridColumn="1 / 2";
      }else if(pos.indexOf("right")>=0){
        element.style.justifySelf="end";
        element.style.gridColumn="3 / 4";
      }else{
        element.style.justifySelf="center";
        element.style.gridColumn="2 / 3";
      }
      if(pos.indexOf("top")>=0){
        element.style.alignSelf="start";
        element.style.gridRow="1 / 2";
      }else if(pos.indexOf("bottom")>=0){
        element.style.alignSelf="end";
        element.style.gridRow="3 / 4";
      }else{
        element.style.alignSelf="center";
        element.style.gridRow="2 / 3";
      }
      this.container.appendChild(element);
      setTimeout(()=>{
        element.style.opacity="1";
        setTimeout(()=>{
          element.style.opacity="0";
          setTimeout(()=>{
            this.container.removeChild(element);
          },1000);
        },duration);
      },10);
      
    },
  };
  
  
  
  
  
  /**Console */
  $App.Console=function(){
    this.element=document.createElement("div");
    this.element.style="width: 100%; height: 100%; background-color: #121212; color: white";
    this.element.className="console";
    this.element.innerHTML="Console";
    this.items={};
    this.visible=false;
    this.variablesDiv=document.createElement("div");
    this.variablesDiv.style="height: 70%; overflow: auto";
    this.element.appendChild(this.variablesDiv);
    this.outputDiv=document.createElement("div");
    this.outputDiv.style="height: 30%; overflow: auto";
    this.element.appendChild(this.outputDiv);
  
  };
  
  $App.Console.prototype={
    log: function(){
      let div=document.createElement("div");
      let args=[]
      for(let i=0;i<arguments.length;i++){
        args.push(arguments[i]);
      }
      div.innerHTML=args.join(" ");
      this.outputDiv.appendChild(div);
      this.outputDiv.scrollTop=this.outputDiv.scrollHeight;
    },
    clear: function(){
      this.element.removeChild(this.outputDiv);
      this.outputDiv=document.createElement("div");
      this.outputDiv.style="height: 50%; overflow: auto";
      this.element.appendChild(this.outputDiv);
    },
    update: function(){
      if($App.language==="js"){
        this.updateJS();
      }else if($App.language==="java"){
        this.updateJava();
      }
    },
    updateJava: function(){
      for(let a in $main){
        let v=$main[a];
        if(typeof v==="function") continue;
        let item;
        if(a in this.items){
          item=this.items[a];
        }else{
          item={
            expanded: false,
            element: document.createElement("div")
          };
          this.items[a]=item;
          this.variablesDiv.appendChild(item.element);
        }
        let typ=v && v.constructor? (v.constructor.name).toLowerCase():"";
        if(typ.startsWith("html")){
          v=v.constructor.name;
        }else if(typ==="file"){
          v="File";
        }else{
          if(v){
            if(typ==="string"){
              v=JSON.stringify(v);
            }
          }
        }
        
        item.element.textContent=""+a+": "+v;
      }
    },
    createConsoleItem: function(name){
      let item={
          expanded: false,
          element: document.createElement("div"),
          value: document.createElement("span"),
          button: document.createElement("span"),
          line: document.createElement("div"),
          expandable: false,
          subItems: [],
          sublist: document.createElement("div"),
          object: undefined
      };
      item.sublist.style.marginLeft="1em";
      item.button.style="text-align: center; display: inline-block; width: 1em; border-radius: 3px";
      item.element.appendChild(item.line);
      item.line.appendChild(item.button);
      var el=document.createElement("span");
      el.textContent=name+": ";
      item.line.appendChild(el);
      item.line.appendChild(item.value);
      item.line.onclick=()=>{
        if(item.expandable){
          item.expanded=!item.expanded;
        }
      };
      item.element.appendChild(item.sublist);
      item.updateSublist=function(){
        if(!this.expanded){
          this.sublist.style.display="none";
        }else{
          var newItems={};
          for(var a in this.object){
            var item;
            var obj=this.object[a];
            if(typeof obj==="function"){
              continue;
            }
            if(a in this.subItems){
              item=this.subItems[a];
            }else{
              item=$App.console.createConsoleItem(a)
              this.sublist.appendChild(item.element);
            }
            item.update(obj);
            newItems[a]=item;
          }
          this.sublist.style.display="";
          for(var a in this.subItems){
            if(!(a in newItems)){
              this.sublist.removeChild(this.subItems[a].element);
            }
          }
          this.subItems=newItems;
        }
      };
      item.update=function(obj){
        var v;
        this.object=obj;
        if(obj===undefined){
          v="undefiniert";
        }else if(obj===null){
          v="null";
        }else if(typeof obj==="object"){
          this.button.style.backgroundColor="gray";
          this.button.textContent=this.expanded? "-": "+";
          this.expandable=true;
          if(Array.isArray(obj)){
            v="Array ("+obj.length+")";
          }else{
            if(obj.constructor){
              v=obj.constructor.name;
            }else{
              v="Objekt";
            }
          }
        }else{
          this.button.style.backgroundColor="";
          this.button.textContent="";
          this.expandable=false;
          v=JSON.stringify(obj);
        }
        this.value.textContent=v;
        this.updateSublist();
      }
      return item;
    },
    updateJS: function(){
      let newItems={};
      for(let a in window){
        if((a in $App.systemVariables)){
          continue;
        }
        let obj=window[a];
        if(obj && obj.$hideFromConsole){
          continue;
        }
        if(obj===window){
          continue;
        }
        if(typeof obj==="function"){
          continue;
        }
        let item;
        if(a in this.items){
          item=this.items[a];
        }else{
          item=this.createConsoleItem(a)
          this.variablesDiv.appendChild(item.element);
        }
        item.update(obj);
        newItems[a]=item;
      }
      for(let a in this.items){
        if(!(a in newItems)){
          this.variablesDiv.removeChild(this.items[a].element);
        }
      }
      this.items=newItems;
    },
    setVisible: function(v){
      this.visible=v;
      let parent=this.element.parentElement;
      if(parent){
        parent.style.display=v? "block": "none";
        if(v){
          parent.nextElementSibling.style.width="70%";
        }else{
          parent.nextElementSibling.style.width="100%";
        }
        setTimeout(function(){
          $App.onResize(true);
        },10);
      }
      
      
    }
  };
  
  $App.console=new $App.Console();
  setInterval(function(){
    this.$App.console.update();
  },200);
  
  /**Help */
  $App.Help=function(){
    this.element=document.createElement("div");
    this.functions=[];
    this.objects=[];
    this.eventHandlers=[];
    this.element.style="overflow-x: hidden; overflow-y: auto;tab-size: 2; padding: 0.5em;background-color: white;position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 100";
    this.element.innerHTML="<h1>Willkommen bei AppJS</h1>"
    +"\n<p>Version "+$App.version+"</p>"
    +"\n<p>Mit AppJS kannst du deine eigenen Apps in der Sprache JavaScript programmieren. AppJS stellt dir einige zusätzliche Befehle zur Verfügung, die dir das Leben etwas einfacher machen.</p>"
    +"\n<p><a href=\"https://thomaskl.uber.space/Webapps/AppJS/help.html\" target=\"_blank\">Link zu dieser Hilfe</a></p>"
    +"\n<h2>Grundaufbau einer App</h2>"
    +"\n<details><summary>Eine App mit AppJS sollte folgendermaßen aussehen:</summary>"
    +"\n<p><code><pre>&lt;script src=\"https://thomaskl.uber.space/Webapps/AppJS/app.js\"&gt;&lt;/script&gt;"
  +"\n&lt;script&gt;"
  +"\n"
  +"\nsetupApp(\"Name meiner App\", \"😀\", 100, 100, \"blue\");"
  +"\n"
  +"\nfunction onStart(){"
  +"\n  drawCircle(50,50,10);"
  +"\n}"
  +"\n"
  +"\n&lt;/script&gt;</pre></code></p>"
    +"\n</details>";
    let closeButton=document.createElement("button");
    closeButton.innerHTML="&times;"
    closeButton.style="font-size: 150%; position: fixed; right: 0.5rem; top: 0.5rem; border-radius: 2px";
    this.element.appendChild(closeButton);
    closeButton.onclick=()=>{
      this.setVisible(false);
    };
    this.helpButton=document.createElement("button");
    this.helpButton.textContent="?"
    this.helpButton.style="font-size: 150%; position: absolute; right: 0.5rem; top: 0.5rem; border-radius: 2px";
    this.helpButton.onclick=()=>{
      this.setVisible(true);
    };
    this.setVisible(false);
  }
  
  $App.Help.prototype={
    printInfos: function(){
      console.log(this.getInfos());
    },
    getInfos: function(){
      return JSON.stringify({
        functions: this.functions,
        objects: this.objects,
        eventHandlers: this.eventHandlers
      });
    },
    addFunction: function(funcInfo){
      // name: name,
      // args: args,
      // info: info,
      // details: details,
      // isNative: isNative
      funcInfo.getAutocompleteSnippet=function(){
  
      }
      this.functions.push(funcInfo);
    },
    addObject: function(name,info,members,details,level){
      this.objects.push({
        name: name,
        info: info,
        members: members,
        details: details,
        level: level
      });
    },
    addEventHandler: function(name,args,info,details){
      this.eventHandlers.push({
        name: name,
        args: args,
        info: info,
        details: details
      });
    },
    setVisible: function(v){
      this.element.style.display=v? "":"none";
    },
    setButtonVisible: function(v){
      this.helpButton.style.display=v? "":"none";
    },
    compileScreen: function(){
      this.functions.sort(function(a,b){
        if(a.name>b.name){
          return 1;
        }else{
          return -1;
        }
      });
      let el;
  
      el=document.createElement('div');
      el.innerHTML='<h2 style="border-bottom: 1pt solid black">Ereignis-Routinen</h2><p>Eine Ereignis-Routine ist eine Funktion, die aufgerufen wird, wenn ein bestimmtes Ereignis eintritt. Füge deinem Programm diese Funktionen hinzu, um auf verschiedenste Ereignisse (Programmstart, Druck auf einen Button des Gamepad, Mausklick usw.) zu reagieren.</p>';
      this.element.appendChild(el);
      for(let i=0;i<this.eventHandlers.length;i++){
        let e=this.eventHandlers[i];
        let div=document.createElement("div");
        let a=[];
        for(let j=0;j<e.args.length;j++){
          a.push(e.args[j].name);
        }
        let code="<details><summary style='background-color: orange;margin-bottom:0.5rem;font-size: 150%' id='help-"+e.name+"'><code>function "+e.name+"("+a.join(", ")+"){...}</code></h2></summary>"+e.info;
        if(e.args.length>0){
          code+="<ul>";
          for(let j=0;j<e.args.length;j++){
            let a=e.args[j];
            code+="<li><code>"+a.name+"</code>: "+a.info+"</li>"
          }
          code+="</ul>";
        }
        if(e.details){
          code+="<p>"+e.details+"</p>"
        }
        "</details>";
        div.innerHTML=code;
        this.element.appendChild(div);
      }
  
      el=document.createElement('div');
      el.innerHTML='<h2 style="border-bottom: 1pt solid black">Funktionen</h2><p>Die folgenden Funktionen kannst du in deinen Programmen verwenden.</p>';
      this.element.appendChild(el);
      for(let i=0;i<this.functions.length;i++){
        let f=this.functions[i];
        let div=document.createElement("div");
        let a=[];
        for(let j=0;j<f.args.length;j++){
          a.push(f.args[j].name);
        }
        let code="<details><summary style='background-color: cyan;margin-bottom:0.5rem;font-size: 150%' id='help-"+f.name+"'><code>"+f.name+"("+a.join(", ")+")</code></h2></summary>"+f.info;
        if(f.args.length>0){
          code+="<ul>";
          for(let j=0;j<f.args.length;j++){
            let a=f.args[j];
            code+="<li><code>"+a.name+"</code>: "+a.info+"</li>"
          }
          code+="</ul>";
        }
        if(f.details){
          code+="<p>"+f.details+"</p>"
        }
        if(f.isNative){
          code+="<p style='font-style: italic; font-size: small'>Dies ist eine normale Funktion von JavaScript, die auch ohne AppJS benutzt werden kann.</p>"
        }
        "</details>";
        div.innerHTML=code;
        this.element.appendChild(div);
      }
       
      el=document.createElement('div');
      el.innerHTML='<h2 style="border-bottom: 1pt solid black">Objekte</h2><p>Ein Objekt buendelt eine Reihe von zusammengehoerigen Funktionen und Eigenschaften. Zur Verwendung musst du immer <code>objekt.eigenschaft</code> schreiben, also z. B. <code>mouse.x</code>.</p>';
      this.element.appendChild(el);
      for(let i=0;i<this.objects.length;i++){
        let o=this.objects[i];
        let div=document.createElement("div");
        let code="<details><summary style='background-color: lime;margin-bottom:0.5rem;font-size: 150%' id='help-"+o.name+"'><code>"+o.name+"</code></summary>"+o.info+"<ul>";
        for(let j=0;j<o.members.length;j++){
          let m=o.members[j];
          code+='<li><code>'+o.name+'.'+m.name+'</code>: '+m.info+'</li>'
        }
        code+="</ul>";
        if(o.details){
          code+="<p>"+o.details+"</p>"
        }
        "</details>";
        div.innerHTML=code;
        this.element.appendChild(div);
      }
    }
  };
  
  $App.help=new $App.Help();
  if($App.language==="java"){
    $App.help.setButtonVisible(false);
  }
  
  $App.addFunction=function addFunction(func,returnType,info,args,details,level){
    let name,isNative;
    if(typeof func==="string"){
      //native Funktion
      name=func;
      isNative=true;
    }else{
      window[func.name]=func;
      name=func.name;
      isNative=false;
    }
    this.help.addFunction({
      name: name,
      returnType: returnType,
      args: args,
      info: info,
      details: details,
      isNative: isNative,
      level: level
    });
  };
  
  $App.addObject=function addObject(name,addMembers,data,info,members,details,level){
    if(addMembers && window[name]){
      let obj=window[name];
      for(let a in data){
        obj[a]=data[a];
      }
    }else{
      window[name]=data;
    }
    this.help.addObject(name,info,members,details,level);
  };
  
  $App.addEventHandler=function addEventHandler(name,args,info,details){
    this.help.addEventHandler(name,args,info,details);
  };
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  /**API */
  
  $App.addEventHandler("onStart",[],'Wird einmalig ausgeführt, wenn das Programm startet.','');
  $App.addEventHandler("onTileDraw",[
    {name: 'x', type: 'double', info: 'x-Koordinate des Mittelpunkts des Feldes.'},
    {name: 'y', type: 'double', info: 'y-Koordinate des Mittelpunkts des Feldes.'},
    {name: 'type', type: 'String', info: 'Typ des Feldes (das Zeichen).'},
    {name: 'info', type: 'String', info: 'Information des Feldes.'},
  ],'Wird für jedes Feld der Spielwelt ausgeführt, wenn diese gezeichnet wird.','');
  $App.addEventHandler("onNextFrame",[],'Wird ca. 60 mal pro Sekunde ausgeführt.','');
  $App.addEventHandler("onKeyDown",[{name: 'keycode', type: 'int', info: 'Der Code der gedrückten Taste, z. B. 65 für "A" oder 32 für die Leertaste.'}],'Wird ausgeführt, wenn eine Taste auf der Tastatur gedrückt wird. ACHTUNG: Funktioniert nicht bei Geräten ohne Tastatur! Verwende lieber das <a href="#help-gamepad">Gamepad</a>.','');
  $App.addEventHandler("onKeyUp",[{name: 'keycode', type: 'int', info: 'Der Code der losgelassenen Taste, z. B. 65 für "A" oder 32 für die Leertaste.'}],'Wird ausgeführt, wenn eine Taste auf der Tastatur losgelassen wird. ACHTUNG: Funktioniert nicht bei Geräten ohne Tastatur! Verwende lieber das <a href="#help-gamepad">Gamepad</a>.','');
  $App.addEventHandler("onMouseDown",[],'Wird ausgeführt, wenn der Benutzer eine Maustaste drückt oder mit dem Finger den Touchscreen berührt.','');
  $App.addEventHandler("onMouseMove",[],'Wird ausgeführt, wenn der Benutzer die Maus bewegt oder mit dem Finger über den Touchscreen streicht.','');
  $App.addEventHandler("onMouseUp",[],'Wird ausgeführt, wenn der Benutzer die Maustaste loslässt oder die Berührung des Touchscreens mit dem Finger beendet.','');
  $App.addEventHandler("onGamepadDown",[{name: 'button', type: 'String', info: 'Der Name des Buttons, der gedrückt wurde, also z. B. "A" oder "Y" oder "left".'}],'Wird ausgeführt, wenn der Benutzer einen Teil des Gamepads berührt oder die zugeordnete Taste auf der Tastatur drückt.','');
  $App.addEventHandler("onGamepadUp",[{name: 'button', type: 'String', info: 'Der Name des Buttons, der losgelassen wurde, also z. B. "A" oder "Y" oder "left".'}],'Wird ausgeführt, wenn der Benutzer die Berührung des Gamepads beendet oder aufhört, die zugeordnete Taste auf der Tastatur zu drücken.','');
  $App.addEventHandler("onTimeout",[{name: 'name',type: 'String', info: 'Der Name des Timers, der abgelaufen ist.'}],'Wird ausgeführt, wenn ein Timer abläuft. Du kannst mit time.start einen Timer starten.','');
  $App.addEventHandler("onAction",[{name: 'trigger', type: 'JComponent', info: 'Das Element, das das Ereignis ausgeloest hat.'}],'Wird ausgeführt, wenn der User mit einem UI-Element interagiert (z. B. auf einen Button klickt).','');
  
  $App.addFunction(function setupApp(title,favicon,width,height,backgroundColor){
    $App.setupApp(title,favicon,width,height,backgroundColor);
  },
  null,
  "Legt die Grundeigenschaften der App fest: Den Titel, das Icon, die Breite und die Höhe sowie die Hintergrundfarbe.",
  [{name: 'title', type: 'String', info: 'Der Name der App, der im Browser-Tab angezeigt wird.'}, {name: 'favicon', type: 'String', info: 'Ein beliebiges Unicode-Symbol, das als Icon für die App verwendet wird. Du findest viele Unicode-Symbole, wenn du direkt nach z. B. "unicode drache" googelst oder unter <a href="https://www.compart.com/de/unicode/" target="_blank">compart.com/de/unicode</a>.'}, {name: 'width', type: 'int', info: 'Die Breite der App.'}, {name: 'height', type: 'int', info: 'Die Höhe der App.'}, {name: 'backgroundColor', type: 'String', info: 'Die Hintergrundfarbe der App.'}],
  'Verwende diesen Befehl zu Beginn der <code>onStart</code>-Funktion.<code><pre>onStart(){\n\tsetupApp("Meine App","🚀",100,100,"black");\n\t//weitere Befehle\n}</pre></code><p></p>',
  true);
  
  $App.addFunction(function distance(x1,y1,x2,y2){
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
  },'double','Berechnet den Abstand der beiden Punkte (<code>x1</code>|<code>y1</code>) und (<code>x2</code>|<code>y2</code>) mit Hilfe des Satz des Pythagoras.',[{name: 'x1', type: 'double', info: 'x-Koordinate des ersten Punktes'},{name: 'y1', type: 'double', info: 'y-Koordinate des ersten Punktes'},{name: 'x2', type: 'double', info: 'x-Koordinate des zweiten Punktes'},{name: 'y2', type: 'double', info: 'y-Koordinate des zweiten Punktes'}],'Verwende diesen Befehl, um festzustellen, ob zwei Dinge kollidieren.<code><pre>if(distance(x,y,gegnerX,gegnerY) < 10){\n\t//Kollision\n}</pre></code>',"everywhere");
  
  $App.addFunction(function clear(){
    $App.canvas.clear();
  },null,'Löscht den Inhalt der Zeichenfläche.',[],'Verwende diesen Befehl zu Beginn der Funktion <a href="#help-onNextFrame"><code>onNextFrame</code></a>, damit du danach alles neu zeichnen kannst.');
  
  $App.addFunction("alert",null,'Zeigt eine Messagebox mit einer Nachricht.',[{name: 'text', type: 'String', info: 'Der Text, der angezeigt werden soll.'}],'',"everywhere");
  
  $App.addFunction("prompt",'String','Zeigt eine Messagebox mit einer Nachricht und  einem Eingabefeld. Liefert den eingegebenen Text zurück.',[{name: 'text', type: 'String',info: 'Der Text, der angezeigt werden soll.'}],'',"everywhere");
  
  $App.addFunction(function promptNumber(text){
    let a;
    let zusatz="";
    do{
      a=prompt(text+zusatz)*1;
      zusatz="\n\nBitte eine Zahl eingeben.";
    }while(isNaN(a));
    return a;
  },'double','Zeigt eine Messagebox mit einer Nachricht und einem Eingabefeld. Liefert die eingegebene Zahl zurück.',[{name: 'text', type: 'String', info: 'Der Text, der angezeigt werden soll.'}],'',"everywhere");
  
  $App.addFunction("confirm",'boolean','Zeigt eine Messagebox mit einer Nachricht. Der Benutzer muss zwischen OK und Abbrechen wählen. Die Auswahl wird als <code>true</code> oder <code>false</code> zurückgegeben.',[{name: 'text', type: 'String', info: 'Der Text, der angezeigt werden soll.'}],'',"everywhere");
  
  $App.addFunction(function toast(text,position,duration){
    $App.toast.show(text,position,duration);
  },null,'Zeigt eine Nachricht für einen gewissen Zeitraum an.',[{name: 'text', type: 'String', info: 'Der Text, der angezeigt werden soll.'}, {name: 'position', type: 'String', info: 'Optional: Eine Angabe aus bis zu 2 Wörtern, die bestimmen, wo der Text erscheinen soll. Mögliche Wörter: <code>"left"</code>, <code>"center"</code>, <code>"right"</code> und <code>"top"</code>, <code>"middle"</code>, <code>"bottom"</code>.'}, {name: 'duration', type: 'int', info: 'Optional: Die Dauer der Anzeige in Millisekunden.'}],'');
  
  $App.addFunction(function sound(asset){
    $App.audio.play(asset);
  },null,'Spielt einen Sound ab. Dieser muss vorher mit loadAssets geladen werden.',[{name: 'asset', type: 'String', info: 'URL des Sounds, der abgespielt werden soll.'}],'');
  
  $App.addFunction(function drawLine(x1,y1,x2,y2){
    return $App.canvas.drawLine(x1,y1,x2,y2);
  },'Path','Zeichnet eine gerade Linie von (x1|y1) bis (x2|y2)',
  [{name: 'x1', type: 'double', info: 'x-Koordinate des ersten Punkts.'}, {name: 'y1', type: 'double', info: 'y-Koordinate des ersten Punkts.'}, {name: 'x2', type: 'double', info: 'x-Koordinate des zweiten Punkts.'}, {name: 'y2', type: 'double', info: 'y-Koordinate des zweiten Punkts.'}],
  'Wenn du eine ganze Figur zeichnen willst, ist es oft besser, einen mittels <a href="#help-path">path</a> einen Pfad zu zeichnen.');
  
  $App.addFunction(function drawCircle(cx,cy,r){
    return $App.canvas.paintCircle(cx,cy,r,false);
  },'Path','Zeichnet einen Kreis und gibt diesen zurück',
  [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'r', type: 'double', info: 'Radius.'}],
  '');
  
  $App.addFunction(function fillCircle(cx,cy,r){
    return $App.canvas.paintCircle(cx,cy,r,true);
  },'Path','Zeichnet einen ausgefüllten Kreis und gibt diesen zurück.',
  [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'r', type: 'double', info: 'Radius.'}],
  '');
  
  $App.addFunction(function drawRect(cx,cy,width,height){
    return $App.canvas.paintRect(cx,cy,width,height,false);
  },'Path','Zeichnet ein Rechteck und gibt dieses zurück.',
  [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}],
  '');
  
  $App.addFunction(function fillRect(cx,cy,width,height){
    return $App.canvas.paintRect(cx,cy,width,height,true);
  },'Path','Zeichnet ein ausgefülltes Rechteck und gibt dieses zurück.',
  [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}],
  '');
  
  $App.addFunction(function rotate(angle,cx,cy){
    $App.canvas.rotate(angle,cx,cy);
  },null,'Dreht alles, was danach gezeichnet wird.',
  [{name: 'angle', type: 'double', info: 'Winkel, um den gedreht wird'}, {name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts der Drehung.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts der Drehung.'}],
  '');

  $App.addFunction(function translate(dx,dy){
    $App.canvas.translate(dx,dy);
  },null,'Verschiebt alles, was danach gezeichnet wird.',
  [{name: 'dx', type: 'double', info: 'Verschiebung in x-Richtung.'}, {name: 'dy', type: 'double', info: 'Verschiebung in y-Richtung.'}],
  '');

  $App.addFunction(function scale(sx,sy,cx,cy){
    $App.canvas.scale(sx,sy,cx,cy);
  },null,'Skaliert alles, was danach gezeichnet wird.',
  [{name: 'sx', type: 'double', info: 'Skalierungsfaktor in x-Richtung. Bei negativem Wert wird an einer vertikalen Achse gespiegelt.'}, {name: 'sy', type: 'double', info: 'Skalierungsfaktor in y-Richtung. Bei negativem Wert wird an einer horizontalen Achse gespiegelt.'}, {name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts der Skalierung.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts der Skalierung.'}],
  '');

  $App.addFunction(function saveCanvasState(){
    $App.canvas.save();
  },null,'Speichert den aktuellen Zustand des Canvas auf einem Stack.',
  [],
  '');

  $App.addFunction(function restoreCanvasState(){
    $App.canvas.restore();
  },null,'Stellt den zuletzt gespeicherten Zustand des Canvas wieder her.',
  [],
  '');

  $App.addFunction(async function loadAsset(url, name){
    $App.registerAsset.call($App,url, name);
  },null,'Lädt ein sog. "Asset" (ein Bild oder ein Sound) und speichert es unter dem angegebenen Namen im Objekt "assets". Muss vor onStart aufgerufen werden.',
  [{name: 'url', type: 'String', info: 'URL der Datei'}, {name: 'name', type: 'String', info: 'Name, unter dem das Asset gespeichert wird.'}],
  '',"topLevel");

  $App.addFunction(async function loadScript(url){
    $App.registerScript.call($App,url);
  },null,'Lädt ein JavaScript. Muss vor onStart aufgerufen werden.',
  [{name: 'url', type: 'String', info: 'URL des Scripts'}],
  '',"topLevel");

  $App.addFunction(function drawImage(image,cx,cy,width,height,rotation,mirrored){
    $App.canvas.drawImage(image,cx,cy,width,height,rotation,mirrored);
  },null,'Zeichnet ein Bild. Dieses musst du vorher mittels loadAsset laden.',
  [{name: 'image', type: 'String', info: 'Bild-Asset. Muss vorher mittels <a href="#help-loadAsset"><code>loadAsset</code></a> geladen werden.'},{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}, {name: 'rotation', type: 'double', info: 'Winkel, um den das Bild gedreht werden soll.'}],
  '');
  $App.addFunction(function drawImagePart(image,cx,cy,width,height,scx,scy,swidth,sheight,rotation,mirrored){
    $App.canvas.drawImage(image,cx,cy,width,height,rotation,mirrored,{cx: scx, cy: scy, w: swidth, h: sheight});
  },null,'Zeichnet einen rechteckigen Ausschnitt eines Bildes. Dieses musst du vorher mittels "loadAsset" laden.',
  [{name: 'image', type: 'String', info: 'Bild-Asset. Muss vorher mittels <a href="#help-loadAsset"><code>loadAsset</code></a> geladen werden.'},{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'},{name: 'scx', type: 'double', info: 'x-Koordinate des Mittelpunkts des Ausschnittes.'}, {name: 'scy', type: 'double', info: 'y-Koordinate des Mittelpunkts des Ausschnittes.'}, {name: 'width', type: 'double', info: 'Breite des Ausschnittes.'}, {name: 'height', type: 'double', info: 'Höhe des Ausschnittes.'}, {name: 'rotation', type: 'double', info: 'Winkel, um den das Bild gedreht werden soll.'}, {name: 'mirrored', type: 'boolean', info: 'true, wenn das Bild vertikal gespiegelt werden soll.'}],
  '');
  
  $App.addFunction(function setColor(color){
    $App.canvas.setColor(color);
  },null,'Legt die Farbe für alle nachfolgenden Zeichnungen fest.',[{name: 'color', type: 'String', info: 'Farbe, die ab sofort zum Zeichnen und Füllen verwendet werden soll. Kann eine beliebige Bezeichnung für eine HTML-Farbe sein, z. B. <code>"red"</code>, <code>"blue"</code> oder <code>"#e307A6"</code>. Diese Bezeichnungen findest du bspw. unter <a href="https://htmlcolorcodes.com/" target="_blank">htmlcolorcodes</a>.'}],'');
  
  $App.addFunction(function setOpacity(value){
    $App.canvas.setOpacity(value);
  },null,'Legt die Transparenz alle nachfolgenden Zeichnungen fest.',[{name: 'value', type: 'double', info: 'Wert zwischen 0 (komplett transparent) und 1 (komplett sichtbar).'}],'');
  
  $App.addFunction(function setFontsize(size){
    $App.canvas.setFontsize(size);
  },null,'Legt die Schriftgröße für alle nachfolgenden write-Befehle fest.',[{name: 'size', type: 'double', info: 'Schriftgröße, die ab sofort zum Schreiben verwendet werden soll.'}],'');

  $App.addFunction(function setFont(name){
    $App.canvas.setFont(name);
  },null,'Legt die Schriftart für alle nachfolgenden write-Befehle fest.',[{name: 'name', type: 'String', info: 'Schriftart, z. B. Arial.'}],'');
  
  $App.addFunction(function setLinewidth(size){
    $App.canvas.setLinewidth(size);
  },null,'Legt die Breite der Linien für alle nachfolgenden Zeichnungen fest.',[{name: 'size', type: 'double', info: 'Die Dicke der Linien, die ab sofort verwendet werden soll.'}],'');
  
  $App.addFunction(function write(text,x,y,align){
    $App.canvas.write(text,x,y,align);
  },null,'Schreibt Text auf den Bildschirm.',
  [{name: 'text', type: 'String', info: 'Der Text, der geschrieben werden soll. Verwende <code>&bsol;n</code> für Zeilenumbrüche.'}, {name: 'x', type: 'double', info: 'Die x-Koordinate des Texts.'}, {name: 'y', type: 'double', info: 'Die y-Koordinate des Texts.'}, {name: 'align', type: 'String', info: 'Eine Angabe aus bis zu 2 Wörtern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. Mögliche Wörter: <code>"left"</code>, <code>"center"</code>, <code>"right"</code> und <code>"top"</code>, <code>"middle"</code>, <code>"bottom"</code>.'}],
  '');
  
  /*$App.addFunction(async function read(placeholdertext,x,y,width,align){
    return await $App.canvas.read(placeholdertext,x,y,width,align,"text");
  },'',[{name: 'placeholdertext', info: 'Text, der als Platzhalter in dem Textfeld angezeigt wird.'}, {name: 'x', info: 'x-Koordinate des Textfelds.'}, {name: 'y', info: 'y-Koordinate des Textfelds.'}, {name: 'width', info: 'Breite des Textfelds. Die Höhe entspricht automatisch der aktuellen Schriftgröße.'}, {name: "align", info: 'Eine Angabe aus bis zu 2 Wörtern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. Mögliche Wörter: <code>"left"</code>, <code>"center"</code>, <code>"right"</code> und <code>"top"</code>, <code>"middle"</code>, <code>"bottom"</code>.'}],'');
  
  $App.addFunction(async function readNumber(placeholdertext,x,y,width,alignment){
    return await $App.canvas.read(placeholdertext,x,y,width,alignment,"number");
  },'',[{name: 'placeholdertext', info: 'Text, der als Platzhalter in dem Textfeld angezeigt wird.'}, {name: 'x', info: 'x-Koordinate des Textfelds.'}, {name: 'y', info: 'y-Koordinate des Textfelds.'}, {name: 'width', info: 'Breite des Textfelds. Die Höhe entspricht automatisch der aktuellen Schriftgröße.'}, {name: "align", info: 'Eine Angabe aus bis zu 2 Wörtern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. Mögliche Wörter: <code>"left"</code>, <code>"center"</code>, <code>"right"</code> und <code>"top"</code>, <code>"middle"</code>, <code>"bottom"</code>.'}],'');*/
  
  $App.addFunction(function random(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
  },'int','Liefert eine ganze Zufallszahl zwischen <code>min</code> und <code>max</code> (jeweils einschließlich).',[{name: 'min', type: 'int', info: 'Mindestwert für die Zufallszahl.'}, {name: 'max', type: 'int', info: 'Maximalwert für die Zufallszahl.'}],'',"everywhere");
  
  $App.addFunction(function isKeyDown(key){
    if(typeof key==="string"){
      key=key.codePointAt(0);
    }
    return $App.keyboard.down[keycode]===true;
  },'boolean','Prüft, ob eine bestimmte Taste auf der Tastatur gedrückt wird.',[{name: 'key', type: 'String', info: 'Das Zeichen, von dem geprüft werden soll, ob die zugehörige Taste gedrückt wird; bspw. "W", " " oder "4".'}],'');
  
  $App.addFunction(function hideHelp(){
    $App.help.setButtonVisible(false);
  },null,'Versteckt den Hilfe-Button oben rechts.',[],'',"everywhere");
  
  $App.addFunction(function showHelp(){
    $App.help.setButtonVisible(true);
  },null,'Zeigt den Hilfe-Button oben rechts wieder an.',[],'',"everywhere");
  
  $App.addObject("mouse",false,{
    get x(){
      return $App.canvas? $App.canvas.getCanvasX($App.mouse.x):null;
    },
    get y(){
      return $App.canvas? $App.canvas.getCanvasY($App.mouse.y):null;
    },
    get down(){
      return $App.mouse.down;
    },
    inRect(cx,cy,width,height){
      let x=this.x;
      let y=this.y;
      return (x>=cx-width/2 && x<=cx+width/2 && y>=cy-height/2 && y<=cy+height/2);
    },
    inCircle(cx,cy,r){
      let x=this.x;
      let y=this.y;
      return ((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r);
    }
  },'Liefert dir Informationen über den Mauszeiger / den Finger (bei Touchscreens).',
  [
    {name: 'x', type: 'double', info: 'Die aktuelle x-Koordinate der Maus.'},
    {name: 'y', type: 'double', info: 'Die aktuelle y-Koordinate der Maus.'},
    {name: 'down', type: 'boolean', info: 'Ist gerade die Maustaste gedrückt / berührt der Finger gerade den Bildschirm?'}, 
    {
      name: 'inRect', 
      returnType: 'boolean',
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts des Rechtecks'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts des Rechtecks'}, {name: 'width', type: 'double', info: 'Breite des Rechtecks'}, {name: 'cx', type: 'double', info: 'Höhe des Rechtecks'}],
      info: 'Prüft, ob sich die Maus aktuell innerhalb des Rechtecks mit Mittelpunkt (cx|cy) und Breite width und Höhe height befindet.'
    }, 
    {
      name: 'inCircle',
      returnType: 'boolean',
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts des Kreises'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts des Kreises'}, {name: 'r', type: 'double', info: 'Radius des Kreises'}],
      info: 'Prüft, ob sich die Maus aktuell innerhalb des Kreises mit Mittelpunkt (cx|cy) und Radius r befindet.'
    }
  ]);
  
  $App.addObject("time",false,{
    get now(){
      return (new Date()).getTime();
    },
    get sec(){
      return (new Date()).getUTCSeconds();
    },
    get min(){
      return (new Date()).getUTCMinutes();
    },
    get h(){
      return (new Date()).getUTCHours();
    },
    get day(){
      return (new Date()).getUTCDate();
    },
    get month(){
      return (new Date()).getUTCMonth()+1;
    },
    get year(){
      return (new Date()).getUTCFullYear();
    },
    start(millis,name){
      if(!$App.timer){
        $App.timer=[];
      }
      if(name){
        name=name.toLowerCase();
        for(let i=0;i<$App.timer.length;i++){
          let t=$App.timer[i];
          if(t.name===name){
            console.log("Es gibt bereits einen Timer mit dem Namen '"+name+"'.");
            return;
          }
        }
      }
      
      let id=setTimeout(()=>{
        if(!$App.debug.paused && window.onTimeout){
          for(let i=0;i<$App.timer.length;i++){
            let t=$App.timer[i];
            if(t.name===name){
              $App.timer.splice(i,1);
              break;
            }
          }
          window.onTimeout(name);
        }else{
          console.log("Du hast einen Timer gestartet, aber es gibt keine 'onTimeout'-Funktion.");
        }
      },millis);
      let timer={
        name: name,
        id: id
      };
      $App.timer.push(timer);
    },
    stop(name){
      if(!$App.timer){
        console.log("Es gibt keinen Timer, den du stoppen kannst.");
        return;
      }
      if(name){
        for(var i=0; i<$App.timer.length;i++){
          let t=$App.timer[i];
          if(t.name.toLowerCase===name){
            $App.timer.splice(i,1);
            clearTimeout(t.id);
            return;
          }
        }
        console.log("Es gibt keinen Timer mit dem Namen '"+name+"', den du stoppen könntest.");
      }else{
        /**Stoppe alle Timer */
        for(var i=0; i<$App.timer.length;i++){
          let t=$App.timer[i];
          clearTimeout(t.id);
        }
        $App.timer=[];
      }
    }
  },'Liefert dir Informationen über die Zeit und erlaubt es dir, Timer zu stellen und zu stoppen.',
  [
    {name: 'now', info: 'Die aktuelle Zeit in Millisekunden seit dem 1.1.1970.', type: 'int'},
    {name: 'sec', info: 'Die Sekundenzahl der aktuellen Uhrzeit.', type: 'int'},
    {name: 'min', type: 'int', info: 'Die Minutenzahl der aktuellen Uhrzeit.'},
    {name: 'h', type: 'int', info: 'Die Stundenzahl der aktuellen Uhrzeit.'},
    {name: 'day', type: 'int', info: 'Der aktuelle Tag im Monat.'},
    {name: 'month', type: 'int', info: 'Der aktuelle Monat (1-12).'},{name: 'year', type: 'int', info: 'Die aktuelle Jahreszahl.'}, 
    {
      name: 'start', 
      returnType: null, 
      args: [{name: 'millis', type: 'int', info: 'Anzahl Millisekunden bis der Timer auslöst.'}, {name: 'name', type: 'String', info: "Name des Timers, mit dem onTimeout aufgerufen wird."}], 
      info: 'Startet einen Timer, der millis Millisekunden lang läuft. Wenn er abläuft, löst er die Funktion <code>onTimeout</code> aus.'
    }, 
    {
      name: 'stop', 
      returnType: null,
      args: [{name: 'name', type: 'String', info: 'Name des Timers, der gestoppt werden soll.'}], 
      info: 'Stoppt den Timer mit dem angegebenen Namen. Wenn du keinen Namen angibst, werden alle laufenden Timer gestoppt.'
    },
    {name: 'year', type: 'int', info: 'Die aktuelle Jahreszahl (vierstellig).'}
  ], "everywhere");
  
  $App.addObject('gamepad',false,{
    get left(){
      return $App.gamepad.isButtonPressed("left");
    },
    get up(){
      return $App.gamepad.isButtonPressed("up");
    },
    get right(){
      return $App.gamepad.isButtonPressed("right");
    },
    get down(){
      return $App.gamepad.isButtonPressed("down");
    },
    get X(){
      return $App.gamepad.isButtonPressed("X");
    },
    get Y(){
      return $App.gamepad.isButtonPressed("Y");
    },
    get A(){
      return $App.gamepad.isButtonPressed("A");
    },
    get B(){
      return $App.gamepad.isButtonPressed("B");
    },
    get E(){
      return $App.gamepad.isButtonPressed("E");
    },
    get F(){
      return $App.gamepad.isButtonPressed("F");
    },
    set left(key){
      $App.gamepad.setButtonKey("left",key);
    },
    set right(key){
      $App.gamepad.setButtonKey("right",key);
    },
    set up(key){
      $App.gamepad.setButtonKey("up",key);
    },
    set down(key){
      $App.gamepad.setButtonKey("down",key);
    },
    set X(key){
      $App.gamepad.setButtonKey("X",key);
    },
    set Y(key){
      $App.gamepad.setButtonKey("Y",key);
    },
    set A(key){
      $App.gamepad.setButtonKey("A",key);
    },
    set B(key){
      $App.gamepad.setButtonKey("B",key);
    },
    set E(key){
      $App.gamepad.setButtonKey("E",key);
    },
    set F(key){
      $App.gamepad.setButtonKey("F",key);
    },
    get multiaxis(){
      return $App.gamepad.multiaxis;
    },
    set multiaxis(v){
      $App.gamepad.multiaxis=v;
    },
    show: function(){
      $App.gamepad.setVisible(true);
    },
    hide: function(){
      $App.gamepad.setVisible(false);
    },
  },'Erlaubt die Benutzung des Gamepads.',
  [
    {
      name: 'show',
      returnType: null,
      info: 'Zeigt das Gamepad an.'
    }, 
    {
      name: 'hide',
      returnType: null,
      info: 'Verbirgt das Gamepad.'
    },
    {
      name: 'left',
      type: 'boolean',
      info: 'Wird gerade der Joystick nach links bewegt?',
    },
    {
      name: 'setLeft',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "Links" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "Steuerkreuz - Links" verbunden werden soll.',
    },
    {
      name: 'right',
      type: 'boolean',
      info: 'Wird gerade der Joystick nach rechts bewegt?'
    },
    {
      name: 'setRight',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "Rechts" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "Steuerkreuz - Rechts" verbunden werden soll.',
    }, 
    {
      name: 'up',
      type: 'boolean',
      info: 'Wird gerade der Joystick nach oben bewegt?'
    },
    {
      name: 'setUp',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "Oben" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "Steuerkreuz - Oben" verbunden werden soll.',
    },
    {
      name: 'down',
      type: 'boolean',
      info: 'Wird gerade der Joystick nach unten bewegt?'
    }, 
    {
      name: 'setDown',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "Unten" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "Steuerkreuz - Unten" verbunden werden soll.',
    },
    {
      name: 'A',
      type: 'boolean',
      info: 'Wird gerade die Taste "A" gedrückt?'
    }, 
    {
      name: 'setA',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "A" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "A" verbunden werden soll.',
    },
    {
      name: 'B',
      type: 'boolean',
      info: 'Wird gerade die Taste "B" gedrückt?'
    },
    {
      name: 'setB',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "B" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "B" verbunden werden soll.',
    }, 
    {
      name: 'X',
      type: 'boolean',
      info: 'Wird gerade die Taste "X" gedrückt?'
    }, 
    {
      name: 'setX',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "X" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "X" verbunden werden soll.',
    },
    {
      name: 'Y',
      type: 'boolean',
      info: 'Wird gerade die Taste "Y" gedrückt?'
    }, 
    {
      name: 'setY',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "Y" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "Y" verbunden werden soll.',
    },
    {
      name: 'E',
      type: 'boolean',
      info: 'Wird gerade die Taste "E" gedrückt?'
    }, 
    {
      name: 'setE',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "E" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "E" verbunden werden soll.',
    },
    {
      name: 'F',
      type: 'boolean',
      info: 'Wird gerade die Taste "F" gedrückt?'
    },
    {
      name: 'setF',
      language: "java",
      returnType: null,
      args: [{name: 'keycode', type: 'int', info: 'Keycode der Taste, die mit "F" verbunden werden soll.'}],
      info: 'Legt fest, welche Taste auf der Tastatur mit "F" verbunden werden soll.',
    },
  ],'Durch Zuweisen eines Zeichens zu einer Taste kannst du festlegen, welche Taste zu welchem Button gehoert:<code><pre>function onStart(){\n\tgamepad.show();\n\t//Bewegung mit WASD:\n\tgamepad.up = "W";\n\tgamepad.down = "S";\n\tgamepad.left = "A";\n\tgamepad.right = "D";\n\t//Buttons E und F ausblenden:\n\tgamepad.E = null;\n\tgamepad.F = null;\n\t//Button B durch Leertaste:\n\tgamepad.B = " ";\n}</pre></code>');
  
  $App.addObject('path',false,{
    begin: function (x,y){
      $App.canvas.beginPath(x,y);
      return this;
    },
    jump: function(dx,dy){
      $App.canvas.jump(dx,dy);
      return this;
    },
    jumpTo: function(x,y){
      $App.canvas.jumpTo(x,y);
      return this;
    },
    line: function(dx,dy){
      $App.canvas.line(dx,dy);
      return this;
    },
    close: function(){
      $App.canvas.closePath();
      return this;
    },
    draw: function(){
      $App.canvas.drawPath();
      return this;
    },
    fill: function(){
      $App.canvas.fillPath();
      return this;
    },
    rect: function(w,h){
      $App.canvas.rect(w,h);
      return this;
    },
    circle: function(r,start,stop){
      $App.canvas.circle(r,start,stop);
      return this;
    },
    contains: function(x,y){
      return $App.canvas.isPointInPath(x,y);
    }
  },'Erlaubt das Zeichnen von Figuren und Linien.',
  [
    {
      name: 'begin', 
      returnType: 'Path',
      args: [{name: 'x', type: 'double', info: 'x-Koordinate'}, {name: 'y', type: 'double', info: 'y-Koordinate'}],
      info: 'Beginnt einen neuen Pfad am Punkt (<code>x</code>|<code>y</code>)'
    }, 
    {
      name: 'jump',
      returnType: 'Path',
      args: [{name: 'dx', type: 'double', info: 'Unterschied in x-Richtung'}, {name: 'dy', type: 'double', info: 'Unterschied in y-Richtung'}],
      info: 'Springt von der aktuellen Position um <code>dx</code> nach rechts und um <code>dy</code> nach oben, ohne etwas zu zeichnen.'
    }, 
    {
      name: 'jumpTo',
      returnType: 'Path',
      args: [{name: 'x', type: 'double', info: 'x-Koordinate'}, {name: 'y', type: 'double', info: 'y-Koordinate'}], 
      info: 'Springt von der aktuellen Position zum Punkt (<code>x</code>|<code>y</code>), ohne etwas zu zeichnen.'
    }, 
    {
      name: 'line',
      returnType: 'Path',
      args: [{name: 'dx', type: 'double', info: 'Unterschied in x-Richtung'}, {name: 'dy', type: 'double', info: 'Unterschied in y-Richtung'}], 
      info: 'Zeichnet eine gerade Linie von der aktuellen Position um <code>dx</code> nach rechts und um <code>dy</code> nach oben.'
    }, 
    {
      name: 'close',
      returnType: 'Path', 
      info: 'Zeichnet eine gerade Linie vom aktuellen Punkt zurück zum Startpunkt des Pfades.'
    }, 
    {
      name: 'draw',
      returnType: 'Path', 
      info: 'Zeichnet den Pfad.'
    }, 
    {
      name: 'fill', 
      returnType: 'Path',
      info: 'Füllt den Pfad.'
    }, 
    {
      name: 'contains',
      returnType: 'boolean',
      args: [{name: 'x', type: 'double', info: 'x-Koordinate'}, {name: 'y', type: 'double', info: 'y-Koordinate'}], 
      info: 'Prüft, ob sich der Punkt (<code>x</code>|<code>y</code>) innerhalb des aktuellen Pfades befindet.'
    }, 
    {
      name: 'rect', 
      returnType: 'Path',
      args: [{name: 'w', type: 'double', info: 'Breite'}, {name: 'h', type: 'double', info: 'Höhe'}],
      info: 'Zeichnet ein Rechteck mit dem aktuellen Punkt als Mittelpunkt und Breite w und Höhe h.'
    }, 
    {
      name: 'circle(r,[start,stop])',
      returnType: 'Path',
      args: [{name: 'r', type: 'double', info: 'Radius'}, {name: 'start', type: 'double', info: 'Startwinkel'}, {name: 'stop', type: 'double', info: 'Endwinkel'}], 
      info: 'Zeichnet einen Kreisbogen mit dem aktuellen Punkt als Mittelpunkt Radius <code>r</code>. Optional kannst du mit <code>start</code> und <code>stop</code> den Anfangs- und den Endwinkel festlegen, um nur einen Teil des Kreises zu zeichnen.'
    }
  ],'');
  
  $App.addObject('ui',false,{
    button: function (text,cx,cy,width,height){
      var b=$App.createElement("button");
      b.innerHTML=text;
      $App.canvas.addElement(b,cx,cy,width,height);
      return b;
    },
    image: function (url,cx,cy,width,height){
      var b=$App.createElement("img");
      b.src=url;
      $App.canvas.addElement(b,cx,cy,width,height);
      return b;
    },
    input: function (type,placeholdertext,cx,cy,width,height){
      //Legacy: wenn die ersten beiden argumente strings sind, passiert nichts, ansonsten wird type auf "text" gesetzt
      if(type!==undefined && type.split && placeholdertext!==undefined && placeholdertext.split){
      }else{
        return this.input("text",type,placeholdertext,cx,cy,width,height);
      }
      var b=$App.createElement("input");
      b.type=type;
      if(b.type==="checkbox"){
        var id=Math.floor(Math.random()*100000000);
        b.id="checkbox-"+id;
        var wrapper=document.createElement("span");
        wrapper.style="display: inline-block; text-align: center";
        wrapper.appendChild(b);
        wrapper.box=b;
        var label=document.createElement("label");
        label.htmlFor=b.id;
        label.innerHTML=placeholdertext;
        wrapper.appendChild(label);
        b=wrapper;
        b.type="checkbox";
        b.appJSData=b.box.appJSData;
      }else if(b.type==="file"){
        //b.name="files[]";
        b.fr=new FileReader();
        b.fr.onload=(ev)=>{
          b.text=ev.target.result;
          b.lines=b.text.split("\n");
          b.files[0].lineCount=b.lines.length;
        };
        b.onchange=function(ev){
          if(!this.files) return;
          let f=this.files[0];
          f.input=this;
          f.currentLine=0;
          this.fr.readAsText(f);
          f.nextLine=function(){
            let lines=this.input.lines;
            if(!lines||lines.length===0){
              return null;
            }
            return lines.splice(0,1)[0];
          }
          
        };
      }
      Object.defineProperty(b,"value",{
        get: function(){
          if(b.type==="file"){
            return b.files[0];
          }
          if(b.type==="checkbox"){
            var valueProp=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"checked");
            var v=valueProp.get.call(b.box);
            return v;
          }
          var valueProp=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
          var v=valueProp.get.call(b);
          if(b.type==="number"||b.type==="range"){
            return v*1;
          }else{
            return v;
          }
        }
      });
      b.placeholder=placeholdertext;
      $App.canvas.addElement(b,cx,cy,width,height);
      return b;
    },
    textarea: function (placeholdertext,cx,cy,width,height){
      var b=$App.createElement("textarea");
      b.placeholder=placeholdertext;
      b.style.resize="none";
      $App.canvas.addElement(b,cx,cy,width,height);
      return b;
    },
    select: function (options,cx,cy,width,height){
      var b=$App.createElement("select");
      b.options=options;
      $App.canvas.addElement(b,cx,cy,width,height);
      return b;
    },
    label: function(text,cx,cy,width,height){
      var b=$App.createElement("div");
      b.style.textAlign="center";
      b.innerHTML=text;
      $App.canvas.addElement(b,cx,cy,width,height);
      return b;
    }
  },'Erlaubt das Hinzufügen und Manipulieren der grafischen Benutzeroberfläche (UI).',[
    {
      name: 'button', 
      returnType: 'JButton',
      args: [{name: 'text', type: 'String', info: 'Aufschrift des Buttons'}, {name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts'}, {name: 'width', type: 'double', info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'}, {name: 'height', type: 'double', info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'}],
      info: 'Erzeugt einen neuen Button mit der Aufschrift <code>text</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Höhe <code>height</code>. Liefert den Button zurück.'
    },
    {
      name: 'image', 
      returnType: 'JImage',
      args: [{name: 'url', type: 'String', info: 'URL zum Bild'}, {name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts'}, {name: 'width', type: 'double', info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'}, {name: 'height', type: 'double', info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'}],
      info: 'Erzeugt ein neues Bild von der URL <code>url</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Höhe <code>height</code>. Liefert das Bild zurück.'
    },
    {
      name: 'input',
      language: 'js', 
      returnType: 'Input',
      args: [
        {
          name: 'text',
          type: 'String', 
          info: 'Art des Inputs'
        },
        {
          name: 'placeholdertext',
          type: 'String', 
          info: 'Text, der angezeigt wird, wenn das Element leer ist.'
        }, 
        {
          name: 'cx', 
          type: 'double', 
          info: 'x-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'cy', 
          type: 'double', 
          info: 'y-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'width', 
          type: 'double', 
          info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }, 
        {
          name: 'height', 
          type: 'double', 
          info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }
      ],
      info: 'Erzeugt ein neues Eingabefeld, in das der User etwas eingeben kann. Mit <code>type</code> legst du fest, was der User eingeben soll (normalerweise <code>"text"</code> oder <code>"number"</code>, es gibt aber <a href="https://www.w3schools.com/html/html_form_input_types.asp" target="_blank">noch viel mehr</a>). Du kannst außerdem den Platzhaltertext <code>placeholdertext</code>, den Mittelpunkt (<code>cx</code>|<code>cy</code>), die Breite <code>width</code> und die Höhe <code>height</code> festlegen. Liefert das Eingabefeld zurück.'
    },
    {
      name: 'textfield',
      language: 'java',
      returnType: 'JTextField',
      args: [
        {
          name: 'placeholdertext',
          type: 'String', 
          info: 'Text, der angezeigt wird, wenn das Element leer ist.'
        }, 
        {
          name: 'cx', 
          type: 'double', 
          info: 'x-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'cy', 
          type: 'double', 
          info: 'y-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'width', 
          type: 'double', 
          info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }, 
        {
          name: 'height', 
          type: 'double', 
          info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }
      ],
      info: 'Erzeugt ein neues Eingabefeld, in das der User Text eingeben kann. Du kannst den Platzhaltertext <code>placeholdertext</code>, den Mittelpunkt (<code>cx</code>|<code>cy</code>), die Breite <code>width</code> und die Höhe <code>height</code> festlegen. Liefert das Element zurück.'
    },
    {
      name: 'textarea', 
      returnType: 'JTextArea',
      args: [
        {
          name: 'placeholdertext',
          type: 'String', 
          info: 'Text, der angezeigt wird, wenn das Element leer ist.'
        }, 
        {
          name: 'cx', 
          type: 'double', 
          info: 'x-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'cy', 
          type: 'double', 
          info: 'y-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'width', 
          type: 'double', 
          info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }, 
        {
          name: 'height', 
          type: 'double', 
          info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }
      ],
      info: 'Erzeugt eine neue TextArea mit dem Platzhaltertext <code>placeholdertext</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Höhe <code>height</code>. Liefert die TextArea zurück.'
    },
    {
      name: 'select',
      returnType: 'JCombobox',
      args: [
        {
          name: 'options',
          type: 'String[]', 
          info: 'Optionen, die zur Auswahl stehen'
        }, 
        {
          name: 'cx', 
          type: 'double', 
          info: 'x-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'cy', 
          type: 'double', 
          info: 'y-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'width', 
          type: 'double', 
          info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }, 
        {
          name: 'height', 
          type: 'double', 
          info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }
      ],
      info: 'Erzeugt ein neues Select-Element mit den Auswahl-Optionen <code>options</code> (ein  Array), dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Höhe <code>height</code>. Liefert das Select-Element zurück.'
    },
    {
      name: 'label',
      returnType: 'JLabel',
      args: [
        {
          name: 'text',
          type: 'String', 
          info: 'Art des Inputs'
        },
        {
          name: 'cx', 
          type: 'double', 
          info: 'x-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'cy', 
          type: 'double', 
          info: 'y-Koordinate des Mittelpunkts'
        }, 
        {
          name: 'width', 
          type: 'double', 
          info: 'Breite. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }, 
        {
          name: 'height', 
          type: 'double', 
          info: 'Höhe. Bei einem negativen Wert wird das Element in seiner natürlichen Größe gezeichnet.'
        }
      ], 
      info: 'Erzeugt ein neues Label mit dem Inhalt <code>text</code>, dem Mittelpunkt (<code>cx</code>|<code>cy</code>), der Breite <code>width</code> und der Höhe <code>height</code>. Liefert das Label zurück.'
    }
  ],'');
  

  $App.addObject('world',true,{
    create: function(width,height){
      $App.world.create(width,height);
    },
    addRow: function(description){
      $App.world.addRow(description);
    },
    setup: function(description){
      $App.world.setup(description);
    },
    replaceTypes: function(oldType,newType){
      $App.world.replaceTypes(oldType,newType);
    },
    draw: async function(){
      if($App.debug.enabled){
        await $App.world.drawAsync();
      }else{
        $App.world.draw();
      }
    },
    scroll(cx,cy){
      $App.world.setCenter(cx,cy);
    },
    scrollBy(dx,dy){
      $App.world.moveCenter(dx,dy);
    },
    zoom: function(factor){
      $App.world.setZoom(factor);
    },
    write: function(text,x,y,align){
      $App.world.write(text,x,y,align);
    },
    drawRect: function(x,y,w,h){
      $App.world.paintRect(x,y,w,h,false);
    },
    fillRect: function(x,y,w,h){
      $App.world.paintRect(x,y,w,h,true);
    },
    drawCircle: function(cx,cy,r,fill){
      $App.world.paintCircle(cx,cy,r,false);
    },
    fillCircle: function(cx,cy,r,fill){
      $App.world.paintCircle(cx,cy,r,true);
    },
    drawImage: function(asset,x,y,w,h,rotation,mirrored){
      $App.world.drawImage(asset,x,y,w,h,rotation,mirrored);
    },
    drawImagePart: function(asset,x,y,w,h,sx,sy,sw,sh,rotation,mirrored){
      $App.world.drawImage(asset,x,y,w,h,rotation,mirrored,sx,sy,sw,sh);
    },
    getType: function(x,y){
      return $App.world.getType(x,y);
    },
    setType: function(x,y,newType){
      $App.world.setType(x,y,newType);
    },
    setInfo: function(x,y,newInfo){
      $App.world.setInfo(x,y,newInfo);
    },
    getInfo: function(x,y){
      return $App.world.getInfo(x,y);
    },
    get mouseX(){
      if(!$App.canvas) return null;
      var c=$App.canvas.getCanvasX($App.mouse.x);
      var w=$App.world.getWorldBounds(c,0,0,0);
      return w.x;
    },
    get mouseY(){
      if(!$App.canvas) return null;
      var c=$App.canvas.getCanvasY($App.mouse.y);
      var w=$App.world.getWorldBounds(0,c,0,0);
      return w.y;
    },
    get mouseDown(){
      return $App.mouse.down;
    },
    mouseInRect(cx,cy,width,height){
      if(!$App.canvas) return false;
      var x=$App.canvas.getCanvasX($App.mouse.x);
      var y=$App.canvas.getCanvasY($App.mouse.y);
      var w=$App.world.getWorldBounds(x,y,0,0);
      x=w.x;
      y=w.y;
      return (x>=cx-width/2 && x<=cx+width/2 && y>=cy-height/2 && y<=cy+height/2);
    },
    mouseInCircle(cx,cy,r){
      if(!$App.canvas) return false;
      var x=$App.canvas.getCanvasX($App.mouse.x);
      var y=$App.canvas.getCanvasY($App.mouse.y);
      var w=$App.world.getWorldBounds(x,y,0,0);
      x=w.x;
      y=w.y;
      return ((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r);
    }
  },'Erlaubt es, eine zweidimensionale Spielwelt zu verwenden, die aus einzelnen quadratischen Feldern (sog. "Tiles" = "Fliesen") besteht.',
  [
    {
      name: 'setup',
      returnType: null,
      args: [{name: 'description', type: 'String', info: 'Dieser Text definiert die Felder der Spielwelt: Jede Zeile definiert eine Zeile der Spielwelt.'}],
      info: 'Definiert die Felder (Tiles) der Spielwelt.'
    }, 
    {
      name: 'getType',
      returnType: "String", 
      args: [
        {name: 'x', type: 'double', info: 'x-Koordinate in der Welt'},
        {name: 'y', type: 'double', info: 'y-Koordinate in der Welt'}
      ],
      info: 'Gibt den Typ (das Zeichen) an der angegebenen Position zurück. Falls es an der Position kein eindeutiges Zeichen gibt, wird null zurückgegeben.'
    }, 
    {
      name: 'setType', 
      returnType: null,
      args: [
        {name: 'x', type: 'double', info: 'x-Koordinate in der Welt'},
        {name: 'y', type: 'double', info: 'y-Koordinate in der Welt'},
        {name: 'newType', type: 'String', info: 'Neuer Typ'}
      ],
      info: 'Ändert den Typ (das Zeichen) an der angegebenen Position.'
    },
    {
      name: 'getInfo',
      returnType: "String", 
      args: [
        {name: 'x', type: 'double', info: 'x-Koordinate in der Welt'},
        {name: 'y', type: 'double', info: 'y-Koordinate in der Welt'}
      ],
      info: 'Gibt die Information an der angegebenen Position zurück.'
    }, 
    {
      name: 'setInfo', 
      returnType: null,
      args: [
        {name: 'x', type: 'double', info: 'x-Koordinate in der Welt'},
        {name: 'y', type: 'double', info: 'y-Koordinate in der Welt'},
        {name: 'newInfo', type: 'String', info: 'Neuer Typ'}
      ],
      info: 'Ändert die Information an der angegebenen Position.'
    },
    {
      name: 'create',
      returnType: null,
      args: [
        {name: 'width', type: 'int', info: 'Anzahl Felder nebeneinander'},
        {name: 'height', type: 'int', info: 'Anzahl Felder untereinander'}
      ],
      info: 'Erschafft eine neue Spielwelt der angegebenen Größe. Alle Typen werden auf " " gesetzt.'
    },
    {
      name: 'addRow',
      returnType: null,
      args: [{name: 'description', type: 'String', info: 'Dieser Text definiert die Felder der neuen Zeile.'}],
      info: 'Fügt der Spielwelt eine neue Zeile hinzu.'
    },
    {
      name: 'replaceTypes',
      returnType: null,
      args: [
        {name: 'oldType', type: 'String', info: 'Felder mit diesem Typ erhalten den neuen Typ.'},
        {name: 'newType', type: 'String', info: 'Der neue Typ, den die Felder erhalten.'}
      ],
      info: 'Ändert den Typ von allen Felder eines bestimmten Typs.'
    },
    {
      name: 'draw',
      returnType: null,
      args: [],
      info: 'Zeichnet die Welt. Implementiere die Funktion "onTileDraw", um zu festzulegen, wie die Felder gezeichnet werden sollen.'
    },
    {
      name: 'scroll',
      returnType: null, 
      args: [
        {name: 'cx', type: 'double', info: 'x-Koordinate, zu der gescrollt wird'},
        {name: 'cy', type: 'double', info: 'y-Koordinate, zu der gescrollt wird'}
      ],
      info: 'Verschiebt die Welt so, dass der angegebene Punkt im Mittelpunkt des Bildschirms liegt.'
    },
    {
      name: 'scrollBy',
      returnType: null, 
      args: [
        {name: 'dx', type: 'double', info: 'Scroll-Weite in x-Richtung'},
        {name: 'dy', type: 'double', info: 'Scroll-Weite in y-Richtung'}
      ],
      info: 'Verschiebt die Welt um die angegebenen Zahlen.'
    },
    {
      name: 'zoom',
      returnType: null, 
      args: [
        {name: 'factor', type: 'double', info: 'Die Stärke des Zoomens: 1 für Einpassung der Welt in den Bildschirm.'}
      ],
      info: 'Legt fest, wie weit in die Welt hinein- bzw. herausgezoomt wird.'
    },
    {
      name: 'write',
      returnType: null, 
      args: [
        {name: 'text', type: 'String', info: 'Der Text, der geschrieben werden soll. Verwende <code>&bsol;n</code> für Zeilenumbrüche.'}, {name: 'x', type: 'double', info: 'Die x-Koordinate des Texts.'}, {name: 'y', type: 'double', info: 'Die y-Koordinate des Texts.'}, {name: 'align', type: 'String', info: 'Eine Angabe aus bis zu 2 Wörtern, die bestimmen, wie der Text am Punkt (<code>x</code>|<code>y</code>) ausgerichtet sein soll. Mögliche Wörter: <code>"left"</code>, <code>"center"</code>, <code>"right"</code> und <code>"top"</code>, <code>"middle"</code>, <code>"bottom"</code>.'}
      ],
      info: 'Schreibt Text in die Spielwelt.'
    },
    {
      name: 'drawRect',
      returnType: 'Path', 
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}],
      info: 'Zeichnet ein Rechteck in die Spielwelt und gibt dieses zurück.'
    },
    {
      name: 'fillRect',
      returnType: 'Path', 
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}],
      info: 'Zeichnet ein ausgefülltes Rechteck in die Spielwelt und gibt dieses zurück.'
    },
    {
      name: 'drawCircle',
      returnType: 'Path', 
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'r', type: 'double', info: 'Radius.'}],
      info: 'Zeichnet einen Kreis in die Spielwelt und gibt dieses zurück.'
    },
    {
      name: 'fillCircle',
      returnType: 'Path', 
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'r', type: 'double', info: 'Radius.'}],
      info: 'Zeichnet einen ausgefüllten Kreis in die Spielwelt und gibt dieses zurück.'
    },
    {
      name: 'drawImage',
      returnType: null, 
      args: [{name: 'image', type: 'String', info: 'Bild-Asset. Muss vorher mittels <a href="#help-loadAsset"><code>loadAsset</code></a> geladen werden.'},{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}, {name: 'rotation', type: 'double', info: 'Winkel, um den das Bild gedreht werden soll.'}, {name: 'mirrored', type: 'boolean', info: 'true, wenn das Bild vertikal gespiegelt werden soll.'}],
      info: 'Zeichnet ein Bild in die Spielwelt. Dieses musst du vorher mittels "loadAsset" laden.'
    },
    {
      name: 'drawImagePart',
      returnType: null, 
      args: [{name: 'image', type: 'String', info: 'Bild-Asset. Muss vorher mittels <a href="#help-loadAsset"><code>loadAsset</code></a> geladen werden.'},{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'},{name: 'scx', type: 'double', info: 'x-Koordinate des Mittelpunkts des Ausschnittes.'}, {name: 'scy', type: 'double', info: 'y-Koordinate des Mittelpunkts des Ausschnittes.'}, {name: 'width', type: 'double', info: 'Breite des Ausschnittes.'}, {name: 'height', type: 'double', info: 'Höhe des Ausschnittes.'}, {name: 'rotation', type: 'double', info: 'Winkel, um den das Bild gedreht werden soll.'}, {name: 'mirrored', type: 'boolean', info: 'true, wenn das Bild vertikal gespiegelt werden soll.'}],
      info: 'Zeichnet einen rechteckigen Ausschnitt eines Bild in die Spielwelt. Dieses musst du vorher mittels "loadAsset" laden.'
    },
    {
      name: 'mouseX',
      info: 'Die aktuelle x-Koordinate der Maus innerhalb der Spielwelt.'
    },
    {
      name: 'mouseY',
      info: 'Die aktuelle y-Koordinate der Maus innerhalb der Spielwelt.'
    },
    {
      name: 'mouseDown',
      info: 'Ist die Maus aktuell gedrückt oder nicht (entspricht mouse.down).'
    },
    {
      name: 'mouseInRect',
      returnType: 'boolean', 
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'width', type: 'double', info: 'Breite.'}, {name: 'height', type: 'double', info: 'Höhe.'}],
      info: 'Prüft, ob sich die Maus aktuell innerhalb eines Rechtecks in der Spielwelt befindet.'
    },
    {
      name: 'mouseInCircle',
      returnType: 'boolean', 
      args: [{name: 'cx', type: 'double', info: 'x-Koordinate des Mittelpunkts.'}, {name: 'cy', type: 'double', info: 'y-Koordinate des Mittelpunkts.'}, {name: 'r', type: 'double', info: 'Radius.'}],
      info: 'Prüft, ob sich die Maus aktuell innerhalb eines Kreises in der Spielwelt befindet.'
    }
  ],'');

  console.realLog=console.log;
  console.realClear=console.clear;
  $App.addObject('console',true,{
    log: function(){
      console.realLog.apply(console,arguments);
      $App.console.log.apply($App.console,arguments);
    },
    clear: function(){
      console.realClear();
      $App.console.clear();
    },
    show: function(){
      $App.showConsoleOnStart=true;
      $App.console.setVisible(true);
    },
    hide: function(){
      $App.showConsoleOnStart=false;
      $App.console.setVisible(false);
    }
  },'Erlaubt die Benutzung der Konsole.',
  [
    {
      name: 'log',
      returnType: null,
      args: [{name: 'text', type: 'String', info: 'Text, der ausgegeben werden soll.'}],
      info: 'Gibt den <code>text</code> in der Konsole aus.'
    }, 
    {
      name: 'show',
      returnType: null, 
      info: 'Zeigt die Konsole an.'
    }, 
    {
      name: 'hide()', 
      returnType: null,
      info: 'Verbirgt die Konsole.'
    }
  ],'',"everywhere");
  
  $App.help.compileScreen();
  
  $App.setup(true);
  
  if($App.language==="js"){
    /**Vordefinierte Variablennamen speichern:*/
    $App.systemVariables={};
    (function(){
      for(var a in window){
        $App.systemVariables[a]=true;
      }
    })();
  }

}