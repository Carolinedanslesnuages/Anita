<script setup lang="ts">
import { computed } from 'vue'
import { NIVEAUX_CRUE } from '@/lib/zonesInondables'
import { useZonesInondablesStore } from '@/stores/zonesInondables'

/**
 * Case « Zones inondables » et légende en texte des niveaux de crue (couleurs des images du service) :
 * l'alternative accessible à la carte.
 */
const magasin = useZonesInondablesStore()

const annonce = computed(() =>
  magasin.affichees ? 'Zones inondables affichées sur la carte. Zoomez pour les voir en détail.' : 'Zones inondables masquées.',
)

function surChangement(evenement: Event): void {
  magasin.basculer((evenement.target as HTMLInputElement).checked)
}
</script>

<template>
  <section aria-labelledby="titre-zones-inondables" class="zones-inondables">
    <h2 id="titre-zones-inondables" class="titre-zones">Les zones inondables du bassin</h2>
    <div class="case">
      <input id="afficher-zones-inondables" type="checkbox" :checked="magasin.affichees" @change="surChangement" />
      <label for="afficher-zones-inondables">Zones inondables</label>
    </div>
    <p class="aide-texte">Chaque niveau de crue a sa couleur sur la carte, expliquée dans la légende ci-dessous.</p>
    <p role="status">{{ annonce }}</p>
    <template v-if="magasin.affichees">
      <h3 id="titre-legende-zones" class="sous-titre-zones">Légende des couleurs</h3>
      <ul aria-labelledby="titre-legende-zones" class="legende-zones">
        <li v-for="niveau in NIVEAUX_CRUE" :key="niveau.id">
          <span :class="['echantillon', `echantillon--${niveau.id}`]" aria-hidden="true" />
          {{ niveau.libelle }} : {{ niveau.descriptionCouleur }}
        </li>
      </ul>
      <p class="aide-texte">Source : Géorisques. Les zones sont celles du débordement de cours d’eau.</p>
    </template>
  </section>
</template>

<style scoped>
.zones-inondables {
  margin-top: 1.5rem;
}
.titre-zones {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}
.sous-titre-zones {
  font-size: 1.1rem;
  margin: 1rem 0 0.5rem;
}
.case {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.case input {
  width: 1.25rem;
  height: 1.25rem;
}
.legende-zones {
  list-style: none;
  padding: 0;
}
.legende-zones li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.echantillon {
  flex: none;
  width: 2rem;
  height: 1.25rem;
  border: 1px solid #3a3a3a;
}
.echantillon--frequente {
  background-color: #a5c0a5;
}
.echantillon--moyenne {
  background-color: #b3e5d6;
}
.echantillon--faible {
  background-color: #c9f5d6;
}
</style>
