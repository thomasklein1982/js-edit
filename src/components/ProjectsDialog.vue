<template>
  <Dialog header="Deine Projekte" v-model:visible="show" :maximizable="true" :modal="true">
    <app-chooser :apps="projects" :selected="name.toLowerCase()" @open="openProject()" @overwrite="saveProject()" @delete="removeProject" @select="setName"/>
    <template #footer>
      <ConfirmPopup/>
      <InputText style="width: 100%" v-model.trim="name" placeholder="Name des neuen Projekts"/>
      <Button :label="selectedProject? 'Projekt überschreiben': 'Neues Projekt speichern'" icon="pi pi-save" @click="confirmSaveProject($event)"/>
    </template>
  </Dialog>
</template>

<script>
import AppChooser from './AppChooser.vue'
import { download, upload, randomInt, loadLocally, saveLocally } from "../lib/helper";

export default {
  data(){
    return {
      show: false,
      showNewProject: false,
      projects: [],
      name: '',
      STORAGE_PROJECTS: 'JSEDIT_STORAGE_PROJECTS',
      STORAGE_PROJECT_PREFIX: 'JSEDIT_STORAGE_PROJECT_'
    };
  },
  computed: {
    disableSaveButton(){
      if(this.name.length===0){
        return true;
      }
      if(this.name.length>25){
        this.name=this.name.substring(0,25);
      }
      return this.selectedProject!==null;
    },
    selectedProject(){
      return this.getProjectByName(this.name.toLowerCase());
    }
  },
  async mounted(){
    let projectIDs=await loadLocally(this.STORAGE_PROJECTS);
    if(!projectIDs) return;
    projectIDs=projectIDs.split(" ");
    for(let i=0;i<projectIDs.length;i++){
      let id=projectIDs[i];
      let key=this.STORAGE_PROJECT_PREFIX+id;
      let save=await loadLocally(key);
      if(save){
        save=JSON.parse(save);
      }
      if(save && save.name){
        let p={
          id: id,
          name: save.name,
          sourceCode: save.src,
          date: new Date(save.date*1)
        }
        this.projects.push(p);
      }else{
        localforage.removeItem(key);
      }
    }
  },
  methods: {
    confirmSaveProject(event) {
      this.$confirm.require({
          target: event.currentTarget,
          message: 'Das Projekt wird überschrieben. Bist du sicher?',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: "Überschreiben!",
          rejectLabel: "Abbrechen",
          accept: () => {
            this.saveProject();
          },
          reject: () => {
            
          }
      });
    },
    downloadAllProjects(){
      let data=[];
      for(let i=0;i<this.projects.length;i++){
        let p=this.projects[i];
        data.push({
          name: p.name,
          src: p.sourceCode,
          date: p.date? p.date.getTime(): 0
        });
      }
      data=JSON.stringify(data);
      download(data,"JSEdit-Projekte.txt");
    },
    async uploadProjects(){
      let code=await upload();
      if(code){
        code=JSON.parse(code.code);
        for(let i=0;i<code.length;i++){
          let c=code[i];
          let p=this.getProjectByName(c.name.toLowerCase());
          if(p){
            let a=confirm("Es gibt bereits ein Projekt namens '"+c.name+"'.\nSoll es überschrieben werden?");
            if(a){
              p.name=c.name;
              p.sourceCode=c.src;
              p.date=new Date(c.date);
              this.saveProjectLocally(p);
            }
          }else{
            p={
              name: c.name,
              id: this.createUniqueProjectID(),
              sourceCode: c.src,
              date: new Date(c.date)
            };
            this.projects.push(p);
            this.saveProjectLocally(p);
          }
        }
        this.saveProjectIDs();
      }
    },
    getProjectByName(name){
      for(let i=0;i<this.projects.length;i++){
        let a=this.projects[i];
        if(a.name.toLowerCase()===name){
          return a;
        }
      }
      return null;
    },
    setName(name){
      this.name=name;
    },
    removeProject(project){
      for(let i=0;i<this.projects.length;i++){
        let p=this.projects[i];
        if(p===project){
          this.projects.splice(i,1);
          let key=this.STORAGE_PROJECT_PREFIX+p.id;
          this.saveProjectIDs();
          localforage.removeItem(key);
          return;
        }
      }
    },
    saveProjectIDs(){
      let ids=[];
      for(let i=0;i<this.projects.length;i++){
        let p=this.projects[i];
        ids.push(p.id);
      }
      saveLocally(this.STORAGE_PROJECTS,ids.join(" "));
    },
    openProject(){
      this.setVisible(false);
      this.$emit('load',this.selectedProject.sourceCode);
    },
    saveProject(){
      let name=this.name.toLowerCase();
      let project;
      if(this.selectedProject){
        project=this.selectedProject;  
      }else{
        project={
          name: this.name,
          id: this.createUniqueProjectID()
        };
        this.projects.push(project);
        this.saveProjectIDs();
      }
      project.date=new Date();
      project.sourceCode=this.$root.sourceCode;
      this.saveProjectLocally(project);
    },
    saveProjectLocally(project){
      let save=JSON.stringify({name: project.name, src: project.sourceCode, date: project.date.getTime()});
      saveLocally(this.STORAGE_PROJECT_PREFIX+project.id,save);
    },
    setVisible(v){
      this.show=v;
    },
    getProjectByID(id){
      for(let i=0;i<this.projects.length;i++){
        let p=this.projects[i];
        if(p.id===id){
          return p;
        }
      }
      return null;
    },
    createUniqueProjectID(){
      let length=8;
      while(true){
        let id="";
        for(let i=0;i<length;i++){
          let c=randomInt(33,126);
          id+=String.fromCharCode(c);
        }
        let p=this.getProjectByID(id);
        if(!p) return id;
      }
    }
  },
  components: {
    AppChooser
  }
}

class Project{
  constructor(name,icon,sourceCode){
    this.name=name;
    this.icon=icon;
    this.sourceCode=sourceCode;
  }
}
</script>