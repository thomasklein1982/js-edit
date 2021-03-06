import { createApp } from 'vue';
import App from './App.vue';
import ClipboardJS from 'clipboard';
import {registerSW} from 'virtual:pwa-register';
import  * as PrimeVue  from "primevue/config";
import  Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import InputSwitch from "primevue/inputswitch";
import * as Dialog  from "primevue/dialog";
import Menubar from 'primevue/menubar';
import Sidebar from 'primevue/sidebar';
import Panel from 'primevue/panel';
import Tree from 'primevue/tree';
import Badge from 'primevue/badge';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Toast from "primevue/toast";
import ConfirmPopup from 'primevue/confirmpopup';
import Splitter from "primevue/splitter";
import SplitterPanel from 'primevue/splitterpanel'
import Slider from "primevue/slider";
import Card from 'primevue/card';
import SelectButton from 'primevue/selectbutton';
import ToggleButton from 'primevue/togglebutton';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Message from "primevue/message";

import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import './style.css';
import './lib/lzstring.js';
import '../public/localforage.min.js';
let text=(appJScode+"");
let pos=text.indexOf("{");
let pos2=text.lastIndexOf("}");
text=text.substring(pos+1,pos2);
window.appJScode=text;

new ClipboardJS('.copy')

const updateSW=registerSW({
  onNeedRefresh(){
    let a=confirm("Eine neue Version ist verfügbar. Willst du aktualisieren (empfohlen!)?");
    if(a){
      updateSW();
    }
  },
  onOfflineReady(){
    console.log("offline ready");
  }
});

let app=createApp(App);
app.use(PrimeVue.default);
app.use(ConfirmationService);
app.use(ToastService);
app.component('Button',Button);
app.component('Dialog',Dialog.default);
app.component('Checkbox',Checkbox);
app.component('InputText',InputText);
app.component('InputNumber',InputNumber);
app.component('Menubar',Menubar);
app.component('Sidebar',Sidebar);
app.component('Panel',Panel);
app.component('Tree',Tree);
app.component('Badge',Badge);
app.component('ConfirmPopup',ConfirmPopup);
app.component('Toast',Toast);
app.component('Splitter',Splitter);
app.component('SplitterPanel',SplitterPanel);
app.component('Slider',Slider);
app.component('InputSwitch',InputSwitch);
app.component('Card',Card);
app.component('SelectButton',SelectButton);
app.component('Dropdown',Dropdown);
app.component('ToggleButton',ToggleButton);
app.component('TabPanel',TabPanel);
app.component('TabView',TabView);
app.component('Message',Message);
window.app=app.mount('#app');

window.onmessage=function(message){
  let data=message.data;
  let app=window.app;
  if(data.type==="error"){
    data=data.data;
    app.$refs.editor.$refs.editor.setRuntimeError(data);
  }else if(data.type==="debug-pause"){
    app.paused=true;
    app.currentLine=data.line;
  }
}

document.addEventListener("keydown", function(e) {
  let platform=window.navigator.userAgentData.platform || window.navigator.platform;
  let key=e.code||e.keyCode;
  if ((platform.match("Mac") ? e.metaKey : e.ctrlKey)  && (key === 83 || key==="KeyS")) {
    e.preventDefault();
    window.app.$refs.editor.$refs.shareDialog.setVisible(true)
  }
}, false);