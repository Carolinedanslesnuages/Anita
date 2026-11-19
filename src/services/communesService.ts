import { lireCommunes, type Commune } from '@/lib/bassins'

const NOMBRE_DE_SUGGESTIONS = 6

/** Suggestions de communes pour un début de nom (API Géo, service public). */
export async function chercherCommunes(nom: string): Promise<Commune[]> {
  const parametres = new URLSearchParams({
    nom,
    fields: 'nom,code,centre,departement',
    boost: 'population',
    limit: String(NOMBRE_DE_SUGGESTIONS),
  })
  const reponse = await fetch(`https://geo.api.gouv.fr/communes?${parametres.toString()}`)
  if (!reponse.ok) throw new Error(`Service des communes indisponible (${reponse.status})`)
  return lireCommunes(await reponse.json())
}
