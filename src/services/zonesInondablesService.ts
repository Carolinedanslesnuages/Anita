import type { ContourGeoJson } from '@/lib/bassins'
import { limitesDuContour, type Limites } from '@/lib/coursEau'
import { adresseZonesInondables, COUCHES_SURFACES_INONDABLES, lireZonesInondables, type ZoneInondable } from '@/lib/zonesInondables'

async function chercherUneCouche(limites: Limites, couche: string): Promise<ZoneInondable[]> {
  const reponse = await fetch(adresseZonesInondables(limites, couche))
  if (!reponse.ok) throw new Error(`Service des zones inondables indisponible (${reponse.status})`)
  return lireZonesInondables(await reponse.json())
}

/** Les zones inondables d'un bassin (service public Géorisques) : une demande par niveau de crue. */
export async function chercherZonesInondablesDuBassin(contour: ContourGeoJson): Promise<ZoneInondable[]> {
  const limites = limitesDuContour(contour)
  if (!limites) return []
  const parNiveau = await Promise.all(COUCHES_SURFACES_INONDABLES.map((couche) => chercherUneCouche(limites, couche)))
  return parNiveau.flat()
}
