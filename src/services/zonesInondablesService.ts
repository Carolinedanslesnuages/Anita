import type { Limites } from '@/lib/coursEau'
import { adresseZonesInondables, COUCHES_SURFACES_INONDABLES, lireZonesInondables, type ZoneInondable } from '@/lib/zonesInondables'

async function chercherUneCouche(limites: Limites, couche: string): Promise<ZoneInondable[]> {
  const reponse = await fetch(adresseZonesInondables(limites, couche))
  if (!reponse.ok) throw new Error(`Service des zones inondables indisponible (${reponse.status})`)
  // Sans surface dans la zone, le service répond une page vide (et non une liste vide) : aucune zone.
  const texte = await reponse.text()
  if (texte.trim() === '') return []
  return lireZonesInondables(JSON.parse(texte))
}

/** Les zones inondables d'une zone de la carte (service public Géorisques) : une demande par niveau de crue. */
export async function chercherZonesInondablesDansLaZone(limites: Limites): Promise<ZoneInondable[]> {
  const parNiveau = await Promise.all(COUCHES_SURFACES_INONDABLES.map((couche) => chercherUneCouche(limites, couche)))
  return parNiveau.flat()
}
