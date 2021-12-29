<template>
  <Card :style="{backgroundColor: selected? 'aqua':''}" @click="$emit('select')">
    <template #title>
      {{app.name}}
    </template>
    <template #content>
      {{app.date}}
    </template>
    <template #footer v-if="selected">
      <ConfirmPopup/>
      <Button icon="pi pi-trash" label="Löschen" @click="remove($event)"></Button>
      <Button icon="pi pi-external-link" label="Öffnen" @click="open($event)"></Button>
    </template>
  </Card>
  
</template>

<script>

export default{
  props: {
    app: Object,
    selected: Boolean
  },
  methods: {
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
