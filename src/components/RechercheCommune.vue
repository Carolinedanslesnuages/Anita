<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { Commune } from '@/lib/bassins'
import { chercherCommunes } from '@/services/communesService'

/** Recherche d'une commune par son nom : suggestions sous le champ, utilisables au clavier. */
const emit = defineEmits<{ choisir: [commune: Commune] }>()

const LONGUEUR_MINIMALE = 2
const DELAI_DE_FRAPPE_MS = 300

const saisie = ref('')
const suggestions = ref<Commune[]>([])
const aRecherche = ref(false)
const enCours = ref(false)
const erreurDeService = ref(false)
const communeChoisie = ref<string | null>(null)
let minuteur: ReturnType<typeof setTimeout> | undefined
let numeroDeRecherche = 0

async function rechercher(): Promise<void> {
  const nom = saisie.value.trim()
  const numero = ++numeroDeRecherche
  communeChoisie.value = null
  erreurDeService.value = false
  if (nom.length < LONGUEUR_MINIMALE) {
    suggestions.value = []
    aRecherche.value = false
    enCours.value = false
    return
  }
  enCours.value = true
  try {
    const trouvees = await chercherCommunes(nom)
    if (numero !== numeroDeRecherche) return
    suggestions.value = trouvees
    aRecherche.value = true
  } catch {
    if (numero !== numeroDeRecherche) return
    suggestions.value = []
    erreurDeService.value = true
  } finally {
    if (numero === numeroDeRecherche) enCours.value = false
  }
}

function surFrappe(valeur: string | number | undefined): void {
  saisie.value = String(valeur ?? '')
  clearTimeout(minuteur)
  minuteur = setTimeout(rechercher, DELAI_DE_FRAPPE_MS)
}

function surValidation(): void {
  clearTimeout(minuteur)
  void rechercher()
}

function choisir(commune: Commune): void {
  communeChoisie.value = `${commune.nom} choisie : la carte se centre dessus.`
  suggestions.value = []
  aRecherche.value = false
  emit('choisir', commune)
}

const annonce = computed(() => {
  if (erreurDeService.value) return 'Le service des communes ne répond pas. Réessayez dans quelques instants.'
  if (communeChoisie.value) return communeChoisie.value
  if (enCours.value) return 'Recherche en cours…'
  if (!aRecherche.value) return ''
  if (suggestions.value.length === 0) return 'Aucune commune ne correspond à ce nom.'
  const nombre = suggestions.value.length
  return `${nombre} commune${nombre > 1 ? 's' : ''} proposée${nombre > 1 ? 's' : ''}.`
})

onUnmounted(() => clearTimeout(minuteur))
</script>

<template>
  <form class="recherche" @submit.prevent="surValidation">
    <div class="champ">
      <label for="recherche-commune">
        Nom de votre commune
        <span id="aide-recherche-commune" class="aide">
          Tapez au moins 2 lettres, puis choisissez une commune dans les suggestions.
        </span>
      </label>
      <input
        id="recherche-commune"
        type="text"
        :value="saisie"
        autocomplete="off"
        aria-describedby="aide-recherche-commune"
        @input="surFrappe(($event.target as HTMLInputElement).value)"
      />
    </div>
    <button class="bouton" type="submit">Rechercher la commune</button>
    <p class="annonce texte-gras" role="status">{{ annonce }}</p>
    <ul v-if="suggestions.length" class="suggestions" aria-label="Communes proposées">
      <li v-for="commune in suggestions" :key="commune.code">
        <button class="bouton bouton--secondaire bouton--petit" type="button" @click="choisir(commune)">
          {{ commune.departement ? `${commune.nom} (${commune.departement})` : commune.nom }}
        </button>
      </li>
    </ul>
  </form>
</template>

<style scoped>
.recherche {
  margin-bottom: 1rem;
}
.annonce {
  margin: 1rem 0 0.5rem;
}
.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
}
.suggestions li {
  margin-bottom: 0.5rem;
}
</style>
