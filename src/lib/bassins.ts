import { surfaceEnKm2 } from '@/lib/geometrie'

/**
 * Les bassins versants (découpage hydrographique du Sandre) : niveaux, requête et lecture de la
 * réponse (fonctions pures). Le niveau « rivière principale » est celui affiché par défaut.
 */
export const NIVEAUX = [
  { id: 'grand', libelle: 'Grand bassin', couche: 'RegionHydro', champCode: 'CdRegionHydro', champNom: 'LbRegionHydro' },
  { id: 'riviere', libelle: 'Bassin de la rivière principale', couche: 'SecteurHydro', champCode: 'CdSecteurHydro', champNom: 'LbSecteurHydro' },
  { id: 'local', libelle: 'Petit bassin local', couche: 'ZoneHydro', champCode: 'CdZoneHydro', champNom: 'LbZoneHydro' },
] as const

export type IdNiveau = (typeof NIVEAUX)[number]['id']
export const NIVEAU_PAR_DEFAUT: IdNiveau = 'riviere'

export function trouverNiveau(id: IdNiveau) {
  return NIVEAUX.find((niveau) => niveau.id === id) ?? NIVEAUX[1]
}

/** [longitude, latitude] (ordre GeoJSON). */
export type Position = [number, number]

/** Un contour GeoJSON (Feature) : la forme du bassin, telle que la dessine la carte. */
export interface ContourGeoJson {
  type: 'Feature'
  properties: Record<string, unknown> | null
  geometry: { type: string; coordinates: unknown }
}

export interface ContourSet {
  type: 'FeatureCollection'
  features: ContourGeoJson[]
}

export interface Bassin {
  code: string
  nom: string
  niveau: IdNiveau
  surfaceKm2: number
  /** Contour au format GeoJSON, tel que le dessine la carte. */
  contour: ContourGeoJson
}

const ADRESSE_SANDRE = 'https://services.sandre.eaufrance.fr/geo/sandre'
const MARGE_EN_DEGRES = 0.0001

/** Adresse de la requête « quel bassin de ce niveau contient ce point ? ». */
export function adresseBassinAuPoint(position: Position, niveau: IdNiveau): string {
  const [longitude, latitude] = position
  const repere = 'urn:ogc:def:crs:EPSG::4326'
  // Le service attend la latitude avant la longitude pour ce repère.
  const zone = [latitude, longitude, latitude + MARGE_EN_DEGRES, longitude + MARGE_EN_DEGRES].join(',')
  const parametres = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: `sa:${trouverNiveau(niveau).couche}`,
    OUTPUTFORMAT: 'geojson',
    SRSNAME: repere,
    BBOX: `${zone},${repere}`,
  })
  return `${ADRESSE_SANDRE}?${parametres.toString()}`
}

/** « la vilaine de sa source (nc) » → « La vilaine de sa source (nc) ». */
export function nomLisible(nom: string): string {
  const propre = nom.replace(/\s+/g, ' ').replace(/ '/g, "'").trim()
  const minuscules = propre === propre.toUpperCase() ? propre.toLowerCase() : propre
  return minuscules.charAt(0).toUpperCase() + minuscules.slice(1)
}

export function formaterSurface(surfaceKm2: number): string {
  const arrondie = surfaceKm2 < 10 ? Math.round(surfaceKm2 * 10) / 10 : Math.round(surfaceKm2)
  return `${arrondie.toLocaleString('fr-FR')} km²`
}

/** Lit la réponse du service ; renvoie null s'il n'y a aucun bassin (point hors territoire couvert). */
export function lireBassin(reponse: unknown, niveau: IdNiveau): Bassin | null {
  const { champCode, champNom } = trouverNiveau(niveau)
  const elements = (reponse as { features?: ContourGeoJson[] } | null)?.features ?? []
  const element = elements.find((candidat) => candidat?.geometry && typeof candidat.properties?.[champNom] === 'string')
  if (!element) return null
  return {
    code: String(element.properties?.[champCode] ?? ''),
    nom: nomLisible(String(element.properties?.[champNom])),
    niveau,
    surfaceKm2: surfaceEnKm2(element.geometry as { type?: string; coordinates?: unknown }),
    contour: element,
  }
}

export interface Commune {
  code: string
  nom: string
  departement: string
  centre: Position
}

/** Lit les suggestions de l'API Géo ; ignore (sans planter) une commune incomplète. */
export function lireCommunes(reponse: unknown): Commune[] {
  if (!Array.isArray(reponse)) return []
  const communes: Commune[] = []
  for (const element of reponse) {
    const coordonnees = element?.centre?.coordinates
    const valide =
      typeof element?.code === 'string' &&
      typeof element?.nom === 'string' &&
      Array.isArray(coordonnees) &&
      coordonnees.length >= 2 &&
      coordonnees.every((nombre: unknown) => typeof nombre === 'number' && Number.isFinite(nombre))
    if (!valide) continue
    communes.push({
      code: element.code,
      nom: element.nom,
      departement: typeof element.departement?.nom === 'string' ? element.departement.nom : '',
      centre: [coordonnees[0], coordonnees[1]],
    })
  }
  return communes
}
