/**
 * Les zones inondables (cartes des surfaces inondables de Géorisques) : elles sont affichées avec les
 * images du service (WMS), légères et complètes quel que soit le zoom. Un niveau de crue = une couche.
 */
export type IdNiveauCrue = 'frequente' | 'moyenne' | 'faible'

export interface NiveauCrue {
  id: IdNiveauCrue
  libelle: string
  /** Couche du service pour ce niveau (débordement de cours d'eau). */
  couche: string
  /** Couleur des images du service pour ce niveau, en texte, pour la légende. */
  descriptionCouleur: string
}

/** Du niveau le plus fréquent au plus rare. */
export const NIVEAUX_CRUE: NiveauCrue[] = [
  { id: 'frequente', libelle: 'Crue fréquente', couche: 'ALEA_SYNT_01_01FOR_FXX', descriptionCouleur: 'vert-gris foncé' },
  { id: 'moyenne', libelle: 'Crue moyenne', couche: 'ALEA_SYNT_01_02MOY_FXX', descriptionCouleur: 'vert d’eau' },
  { id: 'faible', libelle: 'Crue de faible probabilité', couche: 'ALEA_SYNT_01_04FAI_FXX', descriptionCouleur: 'vert très pâle' },
]

const ADRESSE_GEORISQUES = 'https://www.georisques.gouv.fr/services'

/** Adresse des tuiles-images d'un niveau de crue ; {bbox-epsg-3857} est remplacé par MapLibre pour chaque tuile. */
export function adresseTuilesZonesInondables(niveau: NiveauCrue): string {
  return (
    `${ADRESSE_GEORISQUES}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&STYLES=&FORMAT=image/png&TRANSPARENT=true` +
    `&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=${niveau.couche}&BBOX={bbox-epsg-3857}`
  )
}
