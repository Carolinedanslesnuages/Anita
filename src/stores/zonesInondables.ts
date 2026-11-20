import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Limites } from '@/lib/coursEau'
import { ZOOM_MINIMUM_ZONES_INONDABLES, type ZoneInondable } from '@/lib/zonesInondables'
import { chercherZonesInondablesDansLaZone } from '@/services/zonesInondablesService'
import { useBassinStore } from '@/stores/bassin'

/**
 * Afficher ou masquer les zones inondables : partagées par la carte et le texte. Elles ne sont cherchées
 * que lorsque la case est cochée, qu'un bassin est affiché et que la carte est assez zoomée : seule la
 * partie visible de la carte est demandée.
 */
export const useZonesInondablesStore = defineStore('zonesInondables', () => {
  const bassinStore = useBassinStore()
  const affichees = ref(false)
  const zones = ref<ZoneInondable[]>([])
  const chargement = ref(false)
  const erreur = ref<string | null>(null)
  const carteTropLarge = ref(true)
  let zoneVisible: Limites | null = null
  let numeroDeRecherche = 0

  async function chercher(): Promise<void> {
    const numero = ++numeroDeRecherche
    erreur.value = null
    if (!affichees.value || !bassinStore.bassin || carteTropLarge.value || !zoneVisible) {
      zones.value = []
      chargement.value = false
      return
    }
    chargement.value = true
    try {
      const trouvees = await chercherZonesInondablesDansLaZone(zoneVisible)
      if (numero === numeroDeRecherche) zones.value = trouvees
    } catch {
      if (numero === numeroDeRecherche) {
        zones.value = []
        erreur.value = 'Le service des zones inondables ne répond pas. Réessayez dans quelques instants.'
      }
    } finally {
      if (numero === numeroDeRecherche) chargement.value = false
    }
  }

  async function basculer(valeur: boolean): Promise<void> {
    affichees.value = valeur
    await chercher()
  }

  /** La carte a bougé ou changé de zoom : les zones de la partie visible sont recherchées à nouveau. */
  async function changerZoneVisible(limites: Limites, zoom: number): Promise<void> {
    zoneVisible = limites
    carteTropLarge.value = zoom < ZOOM_MINIMUM_ZONES_INONDABLES
    await chercher()
  }

  watch(() => bassinStore.bassin, () => void chercher())

  return { affichees, zones, chargement, erreur, carteTropLarge, basculer, changerZoneVisible }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useZonesInondablesStore, import.meta.hot))
