<script setup lang="ts">
import { computed } from 'vue'
import { formaterLongueur } from '@/lib/coursEau'
import { useBassinStore } from '@/stores/bassin'
import { useCoursEauStore } from '@/stores/coursEau'

/**
 * Case « Rivières et affluents » et liste en texte des cours d'eau principaux : l'alternative
 * accessible à la carte (nom, longueur et sens d'écoulement, de l'amont vers l'aval).
 */
const bassinStore = useBassinStore()
const magasin = useCoursEauStore()

const annonce = computed(() => {
  if (!magasin.affiches) return ''
  if (!bassinStore.bassin) return 'Choisissez d’abord un bassin versant pour voir ses cours d’eau.'
  if (magasin.chargement) return 'Recherche des cours d’eau en cours…'
  if (magasin.erreur) return magasin.erreur
  const nombre = magasin.coursEau.length
  if (nombre === 0) return 'Aucun cours d’eau nommé n’est connu dans ce bassin.'
  return `${nombre} ${nombre > 1 ? 'cours d’eau affichés' : 'cours d’eau affiché'}.`
})

function surChangement(evenement: Event): void {
  void magasin.basculer((evenement.target as HTMLInputElement).checked)
}
</script>

<template>
  <section aria-labelledby="titre-cours-eau" class="cours-eau">
    <h2 id="titre-cours-eau" class="titre-cours-eau">Les cours d’eau du bassin</h2>
    <div class="case">
      <input id="afficher-cours-eau" type="checkbox" :checked="magasin.affiches" @change="surChangement" />
      <label for="afficher-cours-eau">Rivières et affluents</label>
    </div>
    <p class="aide-texte">Les flèches sur la carte et la liste ci-dessous vont de l’amont (la source) vers l’aval.</p>
    <p role="status">{{ annonce }}</p>
    <template v-if="magasin.affiches && magasin.coursEau.length > 0">
      <h3 id="titre-liste-cours-eau" class="sous-titre-cours-eau">Cours d’eau principaux</h3>
      <ul aria-labelledby="titre-liste-cours-eau" class="liste-cours-eau">
        <li v-for="cours in magasin.coursEau" :key="cours.code">
          <span class="texte-gras">{{ cours.nom }}</span> — {{ formaterLongueur(cours.longueurKm) }}, s’écoule de
          l’amont vers l’aval, {{ cours.sens }}
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.cours-eau {
  margin-top: 1.5rem;
}
.titre-cours-eau {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}
.sous-titre-cours-eau {
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
.liste-cours-eau li {
  margin-bottom: 0.5rem;
}
</style>
