import type { ContourGeoJson } from '@/lib/bassins'
import { limitesDuContour } from '@/lib/coursEau'
import { adresseZonesInondables, lireZonesInondables, type ZoneInondable } from '@/lib/zonesInondables'

/** Les zones inondables d'un bassin (service public Géorisques). */
export async function chercherZonesInondablesDuBassin(contour: ContourGeoJson): Promise<ZoneInondable[]> {
  const limites = limitesDuContour(contour)
  if (!limites) return []
  const reponse = await fetch(adresseZonesInondables(limites))
  if (!reponse.ok) throw new Error(`Service des zones inondables indisponible (${reponse.status})`)
  return lireZonesInondables(await reponse.json())
}
