<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CarteBassin from '@/components/CarteBassin.vue'
import ChoixNiveauBassin from '@/components/ChoixNiveauBassin.vue'
import CoursEauDuBassin from '@/components/CoursEauDuBassin.vue'
import InfosBassin from '@/components/InfosBassin.vue'
import RechercheCommune from '@/components/RechercheCommune.vue'
import { useBassinStore } from '@/stores/bassin'
import ZonesInondablesDuBassin from '@/components/ZonesInondablesDuBassin.vue'
import { useCoursEauStore } from '@/stores/coursEau'
import { useZonesInondablesStore } from '@/stores/zonesInondables'

const magasin = useBassinStore()
const { niveau, point, bassin } = storeToRefs(magasin)
const { affiches: coursEauAffiches, coursEau } = storeToRefs(useCoursEauStore())
const { affichees: zonesAffichees } = storeToRefs(useZonesInondablesStore())
</script>

<template>
  <h1>Anita — Votre territoire, dessiné par l’eau</h1>
  <p>
    Trouvez votre commune, ou choisissez un point sur la carte, pour découvrir le territoire de l’eau auquel vous
    appartenez. La carte et le texte donnent les mêmes informations.
  </p>

  <div class="mise-en-page">
    <div class="colonne-infos">
      <RechercheCommune @choisir="magasin.choisirCommune" />
      <ChoixNiveauBassin :niveau="niveau" @changer="magasin.changerNiveau" />
      <InfosBassin class="bloc-infos" />
    </div>
    <div class="colonne-carte">
      <CarteBassin
        :point="point"
        :bassin="bassin"
        :cours-eau="coursEauAffiches ? coursEau : []"
        :zones-affichees="zonesAffichees"
        @choisir-point="magasin.choisirPoint"
      />
      <CoursEauDuBassin />
      <ZonesInondablesDuBassin />
    </div>
  </div>
</template>

<style scoped>
.mise-en-page {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
.bloc-infos {
  margin-top: 1.5rem;
}
@media (min-width: 62em) {
  .mise-en-page {
    grid-template-columns: 1fr 2fr;
  }
}
</style>
