import type { ContourGeoJson } from '@/lib/bassins'
import { adresseCoursEau, limitesDuContour, lireCoursEau, type CoursEau } from '@/lib/coursEau'

/** Les cours d'eau principaux d'un bassin (service public Sandre). */
export async function chercherCoursEauDuBassin(contour: ContourGeoJson): Promise<CoursEau[]> {
  const limites = limitesDuContour(contour)
  if (!limites) return []
  const reponse = await fetch(adresseCoursEau(limites))
  if (!reponse.ok) throw new Error(`Service des cours d'eau indisponible (${reponse.status})`)
  return lireCoursEau(await reponse.json())
}
