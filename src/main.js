import { createApp } from 'vue';
import App from './App.vue';
import {registerSW} from 'virtual:pwa-register';
import  * as PrimeVue  from "primevue/config";
import  Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
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

import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import './style.css';
//import './lib/lzstring.js';
//import './lib/localforage.min.js';

const updateSW=registerSW({
  onNeedRefresh(){
    let a=confirm("Updaten?");
    if(a){
      updateSW();
      window.location.reload();
    }
  },
  onOfflineReady(){
    console.log("offline ready");
  }
});

//window.store={sourceCode: ''};

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
app.mount('#app');
