<script setup lang="ts">
import { libelleCategorie, type Lieu } from '@/lib/lieux'

/** La liste des lieux : l'alternative accessible à la carte, et l'endroit où l'on choisit un lieu. */
defineProps<{ lieux: Lieu[]; lieuChoisi: string | null }>()
const emit = defineEmits<{ choisir: [id: string] }>()
</script>

<template>
  <ul class="liste-lieux">
    <li v-for="lieu in lieux" :key="lieu.id" class="liste-lieux__lieu" :class="{ 'liste-lieux__choisi': lieu.id === lieuChoisi }">
      <h3 class="liste-lieux__nom">{{ lieu.nom }}</h3>
      <p class="liste-lieux__texte">{{ libelleCategorie(lieu.categorie) }} — {{ lieu.adresse }}</p>
      <p v-if="lieu.description" class="liste-lieux__texte">{{ lieu.description }}</p>
      <button
        class="bouton bouton--secondaire bouton--petit"
        type="button"
        :aria-label="`Voir ${lieu.nom} sur la carte`"
        :aria-pressed="lieu.id === lieuChoisi ? 'true' : 'false'"
        @click="emit('choisir', lieu.id)"
      >
        {{ lieu.id === lieuChoisi ? 'Affiché sur la carte' : 'Voir sur la carte' }}
      </button>
    </li>
  </ul>
</template>

<style scoped>
.liste-lieux {
  list-style: none;
  margin: 0;
  padding: 0;
}
.liste-lieux__lieu {
  margin-bottom: 1rem;
}
.liste-lieux__nom {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
}
.liste-lieux__texte {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
}
.liste-lieux__choisi {
  border-left: 4px solid var(--couleur-eau);
  padding-left: 0.75rem;
}
</style>
