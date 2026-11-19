import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { CoursEau } from '@/lib/coursEau'
import { chercherCoursEauDuBassin } from '@/services/coursEauService'
import { useBassinStore } from '@/stores/bassin'

/**
 * Afficher ou masquer les cours d'eau du bassin choisi, et la liste des principaux : partagés par la carte
 * et le texte. Les cours d'eau ne sont cherchés que lorsque la case est cochée et qu'un bassin est affiché.
 */
export const useCoursEauStore = defineStore('coursEau', () => {
  const bassinStore = useBassinStore()
  const affiches = ref(false)
  const coursEau = ref<CoursEau[]>([])
  const chargement = ref(false)
  const erreur = ref<string | null>(null)
  let numeroDeRecherche = 0

  async function chercher(): Promise<void> {
    const numero = ++numeroDeRecherche
    coursEau.value = []
    erreur.value = null
    if (!affiches.value || !bassinStore.bassin) {
      chargement.value = false
      return
    }
    chargement.value = true
    try {
      const trouves = await chercherCoursEauDuBassin(bassinStore.bassin.contour)
      if (numero === numeroDeRecherche) coursEau.value = trouves
    } catch {
      if (numero === numeroDeRecherche) erreur.value = 'Le service des cours d’eau ne répond pas. Réessayez dans quelques instants.'
    } finally {
      if (numero === numeroDeRecherche) chargement.value = false
    }
  }

  async function basculer(valeur: boolean): Promise<void> {
    affiches.value = valeur
    await chercher()
  }

  // Un autre bassin : les cours d'eau sont recherchés à nouveau (si la case est cochée).
  watch(() => bassinStore.bassin, () => void chercher())

  return { affiches, coursEau, chargement, erreur, basculer }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useCoursEauStore, import.meta.hot))
