<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CarteBassin from '@/components/CarteBassin.vue'
import ChoixNiveauBassin from '@/components/ChoixNiveauBassin.vue'
import InfosBassin from '@/components/InfosBassin.vue'
import RechercheCommune from '@/components/RechercheCommune.vue'
import { useBassinStore } from '@/stores/bassin'

const magasin = useBassinStore()
const { niveau, point, bassin } = storeToRefs(magasin)
</script>

<template>
  <h1>Mon bassin versant</h1>
  <p>
    Trouvez votre commune, ou choisissez un point sur la carte, pour découvrir le territoire de l’eau auquel vous
    appartenez. La carte et le texte donnent les mêmes informations.
  </p>

  <div class="fr-grid-row fr-grid-row--gutters">
    <div class="fr-col-12 fr-col-lg-4">
      <RechercheCommune @choisir="magasin.choisirCommune" />
      <ChoixNiveauBassin :niveau="niveau" @changer="magasin.changerNiveau" />
      <InfosBassin class="fr-mt-4w" />
    </div>
    <div class="fr-col-12 fr-col-lg-8">
      <CarteBassin :point="point" :bassin="bassin" @choisir-point="magasin.choisirPoint" />
    </div>
  </div>
</template>
