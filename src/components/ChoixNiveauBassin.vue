<script setup lang="ts">
import { NIVEAUX, type IdNiveau } from '@/lib/bassins'

/** Choix du niveau de bassin à afficher (grand bassin, rivière principale, petit bassin local). */
defineProps<{ niveau: IdNiveau }>()
const emit = defineEmits<{ changer: [niveau: IdNiveau] }>()

const options = NIVEAUX.map((niveau) => ({ id: `niveau-${niveau.id}`, label: niveau.libelle, value: niveau.id }))
</script>

<template>
  <DsfrRadioButtonSet
    :model-value="niveau"
    name="niveau-bassin"
    legend="Niveau de bassin à afficher"
    :options="options"
    inline
    @update:model-value="emit('changer', $event as IdNiveau)"
  />
</template>
