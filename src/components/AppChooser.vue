<template>
  <div style="padding-top: 0.2rem">
    <div style="text-align: right">
      <SelectButton v-model="sort" :options="sortOptions" dataKey="value">
        <template #option="slotProps">
          <i :class="slotProps.option.icon"></i>
        </template>
      </SelectButton>
    </div>
    <AppButton @open="$emit('open',a)" @overwrite="$emit('overwrite',a)" @delete="$emit('delete',a)" @select="$emit('select',a.name)" :selected="selected===a.name.toLowerCase()" v-for="(a,i) in listedApps" :app="a"/>
  </div>
</template>

<script>
import AppButton from './AppButton.vue'

export default {
  props: {
    apps: Array,
    selected: {
      type: String,
      default: ''
    }
  },
  data(){
    return {
      sort: null,
      sortOptions: [
        {icon: 'pi pi-sort-numeric-down', value: 'time-down'},
        {icon: 'pi pi-sort-numeric-up', value: 'time-up'},
        {icon: 'pi pi-sort-alpha-down', value: 'alpha-down'},
        {icon: 'pi pi-sort-alpha-up', value: 'alpha-up'}
      ]
    }
  },
  mounted(){
    this.sort=this.sortOptions[0];
  },
  computed: {
    listedApps(){
      let array=[];
      for(let i=0;i<this.apps.length;i++){
        array.push(this.apps[i]);
      }
      if(this.sort===this.sortOptions[0]){
        array=array.sort(function(a,b){
          return a.date>b.date? -1: 1;
        });
      }else if(this.sort===this.sortOptions[1]){
        array=array.sort(function(a,b){
          return a.date>b.date? 1: -1;
        });
      }else if(this.sort===this.sortOptions[2]){
        array=array.sort(function(a,b){
          return a.name.toLowerCase()>b.name.toLowerCase()? 1: -1;
        });
      }else if(this.sort===this.sortOptions[3]){
        array=array.sort(function(a,b){
          return a.name.toLowerCase()>b.name.toLowerCase()? -1: 1;
        });
      }
      
      return array;
    }
  },
  components: {
    AppButton
  }
}
</script>