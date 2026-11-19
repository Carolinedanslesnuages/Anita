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
    <h2 id="titre-infos-bassin" class="fr-h5">Votre bassin versant</h2>
    <p role="status" :class="{ 'fr-text--bold': magasin.bassin }">{{ annonce }}</p>
    <p v-if="!magasin.point">
      Choisissez une commune ou un point sur la carte : le nom et la surface de votre bassin s’afficheront ici.
    </p>
    <dl v-if="magasin.bassin" class="fr-mb-0">
      <dt class="fr-text--bold">Nom du bassin</dt>
      <dd class="fr-ml-0 fr-mb-1w">{{ magasin.bassin.nom }}</dd>
      <dt class="fr-text--bold">Surface</dt>
      <dd class="fr-ml-0 fr-mb-1w">{{ formaterSurface(magasin.bassin.surfaceKm2) }}</dd>
      <dt class="fr-text--bold">Niveau</dt>
      <dd class="fr-ml-0 fr-mb-1w">{{ libelleNiveau }}</dd>
      <dt class="fr-text--bold">Lieu choisi</dt>
      <dd class="fr-ml-0 fr-mb-1w">{{ lieuChoisi }}</dd>
    </dl>
  </section>
</template>
