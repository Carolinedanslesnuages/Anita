import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { NIVEAU_PAR_DEFAUT, type Bassin, type Commune, type IdNiveau, type Position } from '@/lib/bassins'
import { chercherBassinAuPoint } from '@/services/bassinsService'

/**
 * Le point choisi (commune ou clic), le niveau de bassin et le bassin trouvé : partagés par la carte,
 * le texte à côté de la carte et, plus tard, les autres écrans. Données : service Sandre.
 */
export const useBassinStore = defineStore('bassin', () => {
  const niveau = ref<IdNiveau>(NIVEAU_PAR_DEFAUT)
  const point = ref<Position | null>(null)
  const commune = ref<Commune | null>(null)
  const bassin = ref<Bassin | null>(null)
  const chargement = ref(false)
  const erreur = ref<string | null>(null)
  const aucunBassin = ref(false)
  let numeroDeRecherche = 0

  async function chercherBassin(): Promise<void> {
    if (!point.value) return
    const numero = ++numeroDeRecherche
    chargement.value = true
    erreur.value = null
    aucunBassin.value = false
    try {
      const trouve = await chercherBassinAuPoint(point.value, niveau.value)
      if (numero !== numeroDeRecherche) return // une recherche plus récente a pris la place
      bassin.value = trouve
      aucunBassin.value = trouve === null
    } catch {
      if (numero !== numeroDeRecherche) return
      bassin.value = null
      erreur.value = 'Le service des bassins versants ne répond pas. Réessayez dans quelques instants.'
    } finally {
      if (numero === numeroDeRecherche) chargement.value = false
    }
  }

  async function choisirCommune(communeChoisie: Commune): Promise<void> {
    commune.value = communeChoisie
    point.value = communeChoisie.centre
    await chercherBassin()
  }

  async function choisirPoint(position: Position): Promise<void> {
    commune.value = null
    point.value = position
    await chercherBassin()
  }

  async function changerNiveau(nouveauNiveau: IdNiveau): Promise<void> {
    niveau.value = nouveauNiveau
    await chercherBassin()
  }

  return { niveau, point, commune, bassin, chargement, erreur, aucunBassin, choisirCommune, choisirPoint, changerNiveau }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useBassinStore, import.meta.hot))
