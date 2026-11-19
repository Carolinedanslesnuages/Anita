<script setup lang="ts">
import { NIVEAUX, type IdNiveau } from '@/lib/bassins'

/** Choix du niveau de bassin à afficher (grand bassin, rivière principale, petit bassin local). */
defineProps<{ niveau: IdNiveau }>()
const emit = defineEmits<{ changer: [niveau: IdNiveau] }>()
</script>

<template>
  <fieldset class="niveau">
    <legend class="niveau__legende">Niveau de bassin à afficher</legend>
    <div v-for="option in NIVEAUX" :key="option.id" class="niveau__option">
      <input
        :id="`niveau-${option.id}`"
        type="radio"
        name="niveau-bassin"
        :value="option.id"
        :checked="niveau === option.id"
        @change="emit('changer', option.id)"
      />
      <label :for="`niveau-${option.id}`">{{ option.libelle }}</label>
    </div>
  </fieldset>
</template>

<style scoped>
.niveau {
  margin: 0;
  padding: 0;
  border: 0;
}
.niveau__legende {
  padding: 0;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
.niveau__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
</style>
