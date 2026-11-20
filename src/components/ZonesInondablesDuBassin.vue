<script setup lang="ts">
import { computed } from 'vue'
import { communesParNiveau, NIVEAUX_CRUE } from '@/lib/zonesInondables'
import { useBassinStore } from '@/stores/bassin'
import { useZonesInondablesStore } from '@/stores/zonesInondables'

/**
 * Case « Zones inondables », légende des motifs et liste en texte des communes concernées :
 * l'alternative accessible à la carte (niveau de crue et communes).
 */
const bassinStore = useBassinStore()
const magasin = useZonesInondablesStore()

const communesDesNiveaux = computed(() => communesParNiveau(magasin.zones))

const annonce = computed(() => {
  if (!magasin.affichees) return ''
  if (!bassinStore.bassin) return 'Choisissez d’abord un bassin versant pour voir ses zones inondables.'
  if (magasin.carteTropLarge) return 'De loin, toutes les zones inondables sont dessinées d’une seule couleur. Zoomez sur la carte pour voir chaque niveau de crue avec son motif.'
  if (magasin.chargement) return 'Recherche des zones inondables en cours…'
  if (magasin.erreur) return magasin.erreur
  if (magasin.zones.length === 0) return 'Aucune zone inondable n’est connue dans la partie visible de la carte.'
  const nombre = communesDesNiveaux.value.length
  return `Zones inondables affichées : ${nombre} ${nombre > 1 ? 'niveaux de crue' : 'niveau de crue'}.`
})

function surChangement(evenement: Event): void {
  void magasin.basculer((evenement.target as HTMLInputElement).checked)
}
</script>

<template>
  <section aria-labelledby="titre-zones-inondables" class="zones-inondables">
    <h2 id="titre-zones-inondables" class="titre-zones">Les zones inondables du bassin</h2>
    <div class="case">
      <input id="afficher-zones-inondables" type="checkbox" :checked="magasin.affichees" @change="surChangement" />
      <label for="afficher-zones-inondables">Zones inondables</label>
    </div>
    <p class="aide-texte">Chaque niveau de crue a son motif sur la carte, expliqué dans la légende et la liste ci-dessous.</p>
    <p role="status">{{ annonce }}</p>
    <template v-if="magasin.affichees && bassinStore.bassin">
      <h3 id="titre-legende-zones" class="sous-titre-zones">Légende des motifs</h3>
      <ul aria-labelledby="titre-legende-zones" class="legende-zones">
        <li v-for="niveau in NIVEAUX_CRUE" :key="niveau.id">
          <span :class="['echantillon', `echantillon--${niveau.motif}`]" aria-hidden="true" />
          {{ niveau.libelle }} : {{ niveau.descriptionMotif }}
        </li>
      </ul>
    </template>
    <template v-if="magasin.affichees && magasin.zones.length > 0">
      <h3 id="titre-communes-zones" class="sous-titre-zones">Communes concernées</h3>
      <ul aria-labelledby="titre-communes-zones" class="liste-zones">
        <li v-for="element in communesDesNiveaux" :key="element.niveau.id">
          <span class="texte-gras">{{ element.niveau.libelle }}</span> —
          {{ element.communes.length > 0 ? element.communes.join(', ') : 'communes non précisées par le service' }}
        </li>
      </ul>
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
.liste-zones li {
  margin-bottom: 0.5rem;
}
.echantillon {
  flex: none;
  width: 2rem;
  height: 1.25rem;
  border: 1px solid #00205b;
  background-color: #5f7fb5;
}
.echantillon--hachures {
  background-image: repeating-linear-gradient(135deg, #ffffff 0 3px, transparent 3px 8px);
}
.echantillon--points {
  background-image: radial-gradient(#ffffff 2.5px, transparent 3px);
  background-size: 8px 8px;
}
.echantillon--quadrillage {
  background-image: linear-gradient(#ffffff 2px, transparent 2px), linear-gradient(90deg, #ffffff 2px, transparent 2px);
  background-size: 8px 8px;
}
</style>
