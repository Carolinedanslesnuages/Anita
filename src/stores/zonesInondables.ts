import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ZoneInondable } from '@/lib/zonesInondables'
import { chercherZonesInondablesDuBassin } from '@/services/zonesInondablesService'
import { useBassinStore } from '@/stores/bassin'

/**
 * Afficher ou masquer les zones inondables du bassin choisi : partagées par la carte et le texte.
 * Elles ne sont cherchées que lorsque la case est cochée et qu'un bassin est affiché.
 */
export const useZonesInondablesStore = defineStore('zonesInondables', () => {
  const bassinStore = useBassinStore()
  const affichees = ref(false)
  const zones = ref<ZoneInondable[]>([])
  const chargement = ref(false)
  const erreur = ref<string | null>(null)
  let numeroDeRecherche = 0

  async function chercher(): Promise<void> {
    const numero = ++numeroDeRecherche
    zones.value = []
    erreur.value = null
    if (!affichees.value || !bassinStore.bassin) {
      chargement.value = false
      return
    }
    chargement.value = true
    try {
      const trouvees = await chercherZonesInondablesDuBassin(bassinStore.bassin.contour)
      if (numero === numeroDeRecherche) zones.value = trouvees
    } catch {
      if (numero === numeroDeRecherche) erreur.value = 'Le service des zones inondables ne répond pas. Réessayez dans quelques instants.'
    } finally {
      if (numero === numeroDeRecherche) chargement.value = false
    }
  }

  async function basculer(valeur: boolean): Promise<void> {
    affichees.value = valeur
    await chercher()
  }

  watch(() => bassinStore.bassin, () => void chercher())

  return { affichees, zones, chargement, erreur, basculer }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useZonesInondablesStore, import.meta.hot))
