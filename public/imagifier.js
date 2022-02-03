Imagifier=function(onToTextFinished,onTextError,outputImage,outputAnchor){
  this.canvas=document.createElement("canvas");
  this.outputImage=outputImage;
  this.outputAnchor=outputAnchor;
  this.onToTextFinished=onToTextFinished;
  this.onTextError=onTextError;
  /*Trennt den angezeigten Text von den eigentlichen Daten*/
  this.dataBrackets=["IMAGIFIED_START","IMAGIFIED_END"];
};

Imagifier.prototype={
  setOutputImage: function(image){
    this.outputImage=image;
  },
  setOutputAnchor: function(aElement){
    this.outputAnchor=aElement;
  },
  toTextFromDataURL: function(dataURL){
    var image=document.createElement("img");
    image.src=dataURL;
    var that=this;
    image.onload=function(){
      that.canvas.width=image.width;
      that.canvas.height=image.height;
      var context=that.canvas.getContext("2d");
      context.fillStyle="white";
      context.fillRect(0,0,image.width,image.height);
      context.drawImage(image,0,0,image.width,image.height);
      var data=context.getImageData(0,0,that.canvas.width,that.canvas.height).data;
      that._toTextFinish(data);
    };
  },
  toText: function(imageFile){
    var reader = new FileReader();
    reader.imagifier=this;
    reader.onload = function(e) {
      reader.imagifier.toTextFromDataURL(e.target.result);
    };
    /* Read in the image file as a data URL.*/
    reader.readAsDataURL(imageFile);
  },
  toImage: function(text,displayTextlines,fontSize,backgroundColor,foregroundColor,filename){
    var context=this.canvas.getContext("2d");
    var s=this.dataBrackets[0]+text+this.dataBrackets[1];
    var anzahlZeichen=s.length;
    var anzahlPixel=Math.ceil(s.length/3);
    var dataOffsetY=0;
    if(displayTextlines){
      /*dieser Text wird zunaechst in das Bild gezeichnet, die Daten folgen dahinter*/
      if(!fontSize) fontSize=12;
      context.font=fontSize+"px sans-serif";
      var lineHeight=1.2*fontSize;
      var maxLength=0;
      for(var i=0;i<displayTextlines.length;i++){
        var l=displayTextlines[i].length;
        maxLength=Math.max(maxLength,l);
      }
      var breite1=maxLength*0.7*fontSize;
      var breite2=Math.ceil(Math.sqrt(anzahlPixel));
      var breite=Math.max(breite1,breite2);
      var hoehe=Math.ceil(anzahlPixel/breite)+displayTextlines.length*lineHeight;
      // breite=400;
      // hoehe=400;
      this.canvas.width=breite;
      this.canvas.height=hoehe;
      if(backgroundColor){
        context.fillStyle=backgroundColor;
      }else{
        context.fillStyle="white";
      }
      context.fillRect(0,0,breite,hoehe);
      if(foregroundColor){
        context.fillStyle=foregroundColor;
      }else{
        context.fillStyle="black";
      }
      context.textBaseline="top";
      for(var i=0;i<displayTextlines.length;i++){
        var l=displayTextlines[i];

        context.fillText(l,0,(i)*lineHeight,breite);
      }
      dataOffsetY=displayTextlines.length*lineHeight;
    }else{
      var breite=Math.ceil(Math.sqrt(anzahlPixel));
      var hoehe=Math.ceil(anzahlPixel/breite);
      this.canvas.width=breite;
      this.canvas.height=hoehe;
    }
    var dataHoehe=Math.ceil(anzahlPixel/breite);
    var imageData=context.createImageData(breite,dataHoehe);
    var laenge=breite*dataHoehe*4;
    var j=0;
    for(var i=0;i<laenge;i++){
      if(j<s.length){
        if((i+1)%4==0){
          imageData.data[i]=255;
        }else{
          imageData.data[i]=s.charCodeAt(j);
          j++;
        }
      }else{
        imageData.data[i]=255;
      }
    }
    context.putImageData(imageData,0,dataOffsetY);
    var dataURL=this.canvas.toDataURL();
    if(this.outputImage){
      this.outputImage.src=dataURL;
    }
    if(this.outputAnchor){
      if(filename){
        this.outputAnchor.download=filename;
      }
      this.outputAnchor.href=dataURL;
    }
  },
  _toTextFinish: function(data){
    var laenge=data.length;
    var s="";
    var i=0;
    while(i<laenge){
      if((i+1)%4==0){
        /*alpha wird ausgelassen*/
      }else{
        s+=String.fromCharCode(data[i]);
      }
      i++;
    }
    var pos1=s.indexOf(this.dataBrackets[0]);
    var pos2=s.indexOf(this.dataBrackets[1],pos1+1);
    if(pos1<0 || pos2<0){
      if(this.onTextError){
        this.onTextError("keine Daten gefunden");
      }
    }else{
      s=s.substring(pos1+this.dataBrackets[0].length,pos2);
      if(this.onToTextFinished){
        this.onToTextFinished(s);
      }
    }
  },
  decodeBase64: function(textBase64){
    /*immer 4 Zeichen in 3 Ascii konvertieren:*/
    var i;
    var decode="";
    var anzahlFuellbytes=0; /*0, 1 oder 2 möglich*/
    i=textBase64.length-1;
    if(textBase64.charAt(i)=="="){
      anzahlFuellbytes++;
      i--
      if(textBase64.charAt(i)=="="){
        anzahlFuellbytes++;
        i--
        if(textBase64.charAt(i)=="="){
          anzahlFuellbytes++;
        }
      }
    }
    i=0;
    while(i<textBase64.length){
      decode+=this._convertToAscii(textBase64.charAt(i),textBase64.charAt(i+1),textBase64.charAt(i+2),textBase64.charAt(i+3));
      i+=4;
    }
    return decode;
  },
  encodeBase64: function(textAscii){
    /*immer 3 Zeichen in 4 base64 konvertieren:*/
    var encode="";
    var laenge=textAscii.length;
    var text=textAscii;
    var anzahlFuellbytes=(3-(laenge%3))%3; /*0, 1 oder 2 möglich*/

    for(var i=0;i<anzahlFuellbytes;i++){
      text+=String.fromCharCode(0).charAt(0);
    }
    laenge+=anzahlFuellbytes;

    var i=0;
    while(i<laenge){
      encode+=this._convertToBase64(text.charAt(i),text.charAt(i+1),text.charAt(i+2));
      i+=3;
    }
    return encode;
  },
  _getBase64Bits: function(base64Zeichen){
    /*ascii: +: 2B=0010 1011; /: 2F=0010 1111; 0: 30=0011 0000=48; A: 41=0101 0001=65; a: 61=0110 0001=97
    base64: A: 0, a: 26, 0: 52, +: 62, /: 63*/
    var bits;
    if(base64Zeichen=="="){
      return "00000000";
    }else if(base64Zeichen=="+"){
      bits="111110";
    }else if(base64Zeichen=="/"){
      bits="111111";
    }else{
      var ascii=base64Zeichen.charCodeAt(0);
      if(ascii>=65 && ascii<91){
        /*grosser buchstabe*/
        bits=(ascii-65).toString(2);
      } else if(ascii>=97 && ascii<123){
        /*kleiner buchstabe*/
        bits=(ascii-71).toString(2);
      } else{
        /*zahl*/
        bits=(ascii+4).toString(2);
      }
    }
    while(bits.length<6){
      bits="0"+bits;
    }
    return bits;
  },
   /*konvertiert vier code64-Zeichen in drei Ascii-Zeichen*/
  _convertToAscii: function(code64Zeichen1,code64Zeichen2,code64Zeichen3,code64Zeichen4){
    var anzahlFuellbytes=0;
    if(code64Zeichen4=="="){
      if(code64Zeichen3=="="){
        anzahlFuellbytes=2;
      }else{
        anzahlFuellbytes=1;
      }
    }
    var code64bits1=this._getBase64Bits(code64Zeichen1);
    var code64bits2=this._getBase64Bits(code64Zeichen2);
    var code64bits3=this._getBase64Bits(code64Zeichen3);
    var code64bits4=this._getBase64Bits(code64Zeichen4);
    var combine=code64bits1+code64bits2+code64bits3+code64bits4;
    var bits1=combine.substring(0,8);
    var bits2=combine.substring(8,16);
    var bits3=combine.substring(16);
    var code1=parseInt(bits1,2);
    var code2=parseInt(bits2,2);
    var code3=parseInt(bits3,2);

    var zeichen1=String.fromCharCode(code1,2).charAt(0);
    if(anzahlFuellbytes>=1){
      var zeichen2="";
    }else{
      var zeichen2=String.fromCharCode(code2,2).charAt(0);
    }
    if(anzahlFuellbytes==2){
      var zeichen3="";
    }else{
      var zeichen3=String.fromCharCode(code3,2).charAt(0);
    }
    return zeichen1+zeichen2+zeichen3;
  },
  _createBase64Zeichen: function(sixBitInt){
    if(sixBitInt<26){
      //grosser buchstabe:
      return String.fromCharCode(sixBitInt+65).charAt(0);
    }else if(sixBitInt<52){
      return String.fromCharCode(sixBitInt+71).charAt(0);
    }else if(sixBitInt<62){
      return String.fromCharCode(sixBitInt-4).charAt(0);
    }else if(sixBitInt==62){
      return "+";
    }else if(sixBitInt==63){
      return "/";
    }
  },
  _getAsciiBits: function(asciiZeichen){
    var code=asciiZeichen.charCodeAt(0);
    var bits=code.toString(2);
    while(bits.length<8){
      bits="0"+bits;
    }
    return bits;
  },
  _convertToBase64: function(asciiZeichen1,asciiZeichen2,asciiZeichen3){
    var asciiBits1=this._getAsciiBits(asciiZeichen1);
    var asciiBits2=this._getAsciiBits(asciiZeichen2);
    var asciiBits3=this._getAsciiBits(asciiZeichen3);
    var anzahlFuellbytes=0;
    if(asciiBits2=="00000000"){
      if(asciiBits3=="00000000"){
        anzahlFuellbytes=2;
      }else{
        anzahlFuellbytes=1;
      }
    }
    var combine=asciiBits1+asciiBits2+asciiBits3;
    var bits1=combine.substring(0,6);
    var bits2=combine.substring(6,12);
    var bits3=combine.substring(12,18);
    var bits4=combine.substring(18);
    var code1=parseInt(bits1,2);
    var code2=parseInt(bits2,2);
    var code3=parseInt(bits3,2);
    var code4=parseInt(bits4,2);
    var zeichen1=this._createBase64Zeichen(code1);
    var zeichen2=this._createBase64Zeichen(code2);
    if(anzahlFuellbytes>=1){
      var zeichen3="=";
    }else{
      var zeichen3=this._createBase64Zeichen(code3);
    }
    if(anzahlFuellbytes==2){
      var zeichen4="=";
    }else{
      var zeichen4=this._createBase64Zeichen(code4);
    }
    return zeichen1+zeichen2+zeichen3+zeichen4;
  }
};