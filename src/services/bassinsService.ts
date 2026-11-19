import { adresseBassinAuPoint, lireBassin, type Bassin, type IdNiveau, type Position } from '@/lib/bassins'

/** Le bassin d'un niveau qui contient un point (service public Sandre). null si aucun bassin. */
export async function chercherBassinAuPoint(position: Position, niveau: IdNiveau): Promise<Bassin | null> {
  const reponse = await fetch(adresseBassinAuPoint(position, niveau))
  if (!reponse.ok) throw new Error(`Service des bassins indisponible (${reponse.status})`)
  return lireBassin(await reponse.json(), niveau)
}
