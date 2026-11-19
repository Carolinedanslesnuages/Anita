<script setup lang="ts">
import { computed } from 'vue'
import { formaterSurface, trouverNiveau } from '@/lib/bassins'
import { useBassinStore } from '@/stores/bassin'

/** Le bassin en texte : l'alternative accessible à la carte (nom, niveau, surface, point choisi). */
const magasin = useBassinStore()

const libelleNiveau = computed(() => (magasin.bassin ? trouverNiveau(magasin.bassin.niveau).libelle : ''))
const lieuChoisi = computed(() =>
  magasin.commune
    ? `Commune ${magasin.commune.nom}`
    : magasin.point
      ? `Point de la carte (latitude ${magasin.point[1].toFixed(4)}, longitude ${magasin.point[0].toFixed(4)})`
      : '',
)
const annonce = computed(() => {
  if (magasin.chargement) return 'Recherche du bassin versant en cours…'
  if (magasin.erreur) return magasin.erreur
  if (magasin.aucunBassin) return 'Aucun bassin versant n’est connu à cet endroit. Choisissez un point en France.'
  if (magasin.bassin) return `Bassin trouvé : ${magasin.bassin.nom}, ${formaterSurface(magasin.bassin.surfaceKm2)}.`
  return ''
})
</script>

<template>
  <section aria-labelledby="titre-infos-bassin">
    <h2 id="titre-infos-bassin" class="titre-infos">Votre bassin versant</h2>
    <p role="status" :class="{ 'texte-gras': magasin.bassin }">{{ annonce }}</p>
    <p v-if="!magasin.point">
      Choisissez une commune ou un point sur la carte : le nom et la surface de votre bassin s’afficheront ici.
    </p>
    <dl v-if="magasin.bassin" class="infos">
      <dt class="texte-gras">Nom du bassin</dt>
      <dd>{{ magasin.bassin.nom }}</dd>
      <dt class="texte-gras">Surface</dt>
      <dd>{{ formaterSurface(magasin.bassin.surfaceKm2) }}</dd>
      <dt class="texte-gras">Niveau</dt>
      <dd>{{ libelleNiveau }}</dd>
      <dt class="texte-gras">Lieu choisi</dt>
      <dd>{{ lieuChoisi }}</dd>
    </dl>
  </section>
</template>

<style scoped>
.titre-infos {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}
.infos {
  margin: 0;
}
.infos dd {
  margin: 0 0 0.5rem;
}
</style>
