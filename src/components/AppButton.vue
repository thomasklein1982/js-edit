<template>
  <Card :style="{backgroundColor: selected? 'aqua':''}" @click="$emit('select')">
    <template #title>
      {{app.name}}
    </template>
    <template #content>
      {{dateString}}
    </template>
    <template #footer v-if="selected">
      <ConfirmPopup/>
      <Button icon="pi pi-trash" label="Löschen" @click="remove($event)"></Button>
      <Button icon="pi pi-external-link" label="Öffnen" @click="open($event)"></Button>
    </template>
  </Card>
  
</template>

<script>
let timer;

export default{
  props: {
    app: Object,
    selected: Boolean
  },
  data(){
    return {
      dateString: ''
    }
  },
  mounted(){
    this.updateDateString();
    timer=setInterval(()=>{
      this.updateDateString()
    },2000);
  },
  unmounted(){
    clearInterval(timer);
  },
  methods: {
    updateDateString(){
      let now=new Date();
      let d=this.app.date;
      let anfang;
      let zeit;
      let twoDigits=function(z){
        if(z<10){
          return "0"+z;
        }else{
          return z;
        }
      };
      let tag=["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][d.getDay()];
      if(now-d<24*60*60*1000 && d.getDate()===now.getDate()){
        anfang="Heute";
        zeit=now-d;
        if(zeit<60*1000){
          zeit="vor weniger als 1 Minute";
        }else if(zeit<60*60*1000){
          zeit="vor "+Math.round(zeit/(60*1000))+" Minuten";
        }else{
          zeit=twoDigits(d.getHours())+":"+twoDigits(d.getMinutes())+" Uhr";
        }
      }else{
        zeit=twoDigits(d.getHours())+":"+twoDigits(d.getMinutes())+" Uhr";
        if(now-d<7*24*60*60*1000){
          anfang="letzten "+tag
        }else{
          anfang=tag+", "+d.getDate()+". "+["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][d.getMonth()];
          if(now.getFullYear()===d.getFullYear()){

          }else{
            anfang+=" "+d.getFullYear();
          }
        }
      } 
      this.dateString=anfang+", "+zeit;
    },
    remove(event) {
      this.$confirm.require({
          target: event.currentTarget,
          message: 'Bist du sicher?',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: "Löschen!",
          rejectLabel: "Abbrechen",
          accept: () => {
            this.$emit('delete');
          },
          reject: () => {
            
          }
      });
    },
    overwrite(event) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Bist du sicher? Der alte Code geht verloren.',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: "Ja",
        rejectLabel: "Abbrechen",
        accept: () => {
          this.$emit('overwrite');
        },
        reject: () => {
          
        }
      });
    },
    open(event) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Bist du sicher? Der alte Code geht verloren.',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: "Ja",
        rejectLabel: "Abbrechen",
        accept: () => {
          this.$emit('open');
        },
        reject: () => {
          
        }
      });
    }
  }
}
</script>
