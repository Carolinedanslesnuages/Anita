import type { ContourGeoJson, Position } from '@/lib/bassins'
import { nomLisible } from '@/lib/bassins'

/**
 * Les cours d'eau d'un bassin (couche « CoursEau » du Sandre) : requête et lecture de la
 * réponse (fonctions pures). Les tracés sont numérisés de la source (amont) vers l'embouchure (aval).
 */
export const NOMBRE_MAXIMUM_COURS_EAU = 20

/** Limites d'une zone : [ouest, sud, est, nord] en degrés. */
export type Limites = [number, number, number, number]

export interface CoursEau {
  code: string
  nom: string
  longueurKm: number
  /** Texte du sens d'écoulement, par exemple « vers le sud-est ». */
  sens: string
  /** Tracé GeoJSON, de l'amont vers l'aval. */
  trace: ContourGeoJson
}

const ADRESSE_SANDRE = 'https://services.sandre.eaufrance.fr/geo/sandre'
const RAYON_TERRE_KM = 6371

/** Limites d'un contour GeoJSON (parcourt toutes ses coordonnées). null si le contour est vide. */
export function limitesDuContour(contour: ContourGeoJson): Limites | null {
  const limites: Limites = [Infinity, Infinity, -Infinity, -Infinity]
  const parcourir = (coordonnees: unknown): void => {
    if (!Array.isArray(coordonnees)) return
    if (typeof coordonnees[0] === 'number' && typeof coordonnees[1] === 'number') {
      limites[0] = Math.min(limites[0], coordonnees[0])
      limites[1] = Math.min(limites[1], coordonnees[1])
      limites[2] = Math.max(limites[2], coordonnees[0])
      limites[3] = Math.max(limites[3], coordonnees[1])
      return
    }
    coordonnees.forEach(parcourir)
  }
  parcourir(contour.geometry?.coordinates)
  return Number.isFinite(limites[0]) ? limites : null
}

/** Adresse de la requête « quels cours d'eau passent dans cette zone ? ». */
export function adresseCoursEau(limites: Limites): string {
  const [ouest, sud, est, nord] = limites
  const repere = 'urn:ogc:def:crs:EPSG::4326'
  const parametres = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: 'sa:CoursEau',
    OUTPUTFORMAT: 'geojson',
    SRSNAME: repere,
    // Le service attend la latitude avant la longitude pour ce repère.
    BBOX: `${sud},${ouest},${nord},${est},${repere}`,
  })
  return `${ADRESSE_SANDRE}?${parametres.toString()}`
}

function distanceEnKm(depart: Position, arrivee: Position): number {
  const enRadians = (degres: number) => (degres * Math.PI) / 180
  const ecartLatitude = enRadians(arrivee[1] - depart[1])
  const ecartLongitude = enRadians(arrivee[0] - depart[0])
  const carreDeLaDemiCorde =
    Math.sin(ecartLatitude / 2) ** 2 +
    Math.cos(enRadians(depart[1])) * Math.cos(enRadians(arrivee[1])) * Math.sin(ecartLongitude / 2) ** 2
  return 2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(carreDeLaDemiCorde))
}

/** Les lignes (suites de positions) d'une géométrie LineString ou MultiLineString. */
function lignesDeLaGeometrie(geometrie: ContourGeoJson['geometry'] | null | undefined): Position[][] {
  if (!geometrie || !Array.isArray(geometrie.coordinates)) return []
  if (geometrie.type === 'LineString') return [geometrie.coordinates as Position[]]
  if (geometrie.type === 'MultiLineString') return geometrie.coordinates as Position[][]
  return []
}

export function longueurEnKm(geometrie: ContourGeoJson['geometry'] | null | undefined): number {
  let total = 0
  for (const ligne of lignesDeLaGeometrie(geometrie)) {
    ligne.forEach((position, rang) => {
      const precedente = ligne[rang - 1]
      if (precedente) total += distanceEnKm(precedente, position)
    })
  }
  return total
}

const POINTS_CARDINAUX = ['le nord', 'le nord-est', 'l’est', 'le sud-est', 'le sud', 'le sud-ouest', 'l’ouest', 'le nord-ouest']

/** Sens d'écoulement en texte, de la source à l'embouchure : « vers le sud-est ». */
export function sensEcoulement(geometrie: ContourGeoJson['geometry'] | null | undefined): string {
  const lignes = lignesDeLaGeometrie(geometrie).filter((ligne) => ligne.length >= 2)
  const premiereLigne = lignes[0]
  const derniereLigne = lignes[lignes.length - 1]
  const premiere = premiereLigne?.[0]
  const derniere = derniereLigne?.[derniereLigne.length - 1]
  if (!premiere || !derniere) return 'sens inconnu'
  const versEst = (derniere[0] - premiere[0]) * Math.cos((((premiere[1] + derniere[1]) / 2) * Math.PI) / 180)
  const versNord = derniere[1] - premiere[1]
  if (versEst === 0 && versNord === 0) return 'sens inconnu'
  const angle = (Math.atan2(versEst, versNord) * 180) / Math.PI // 0 = nord, 90 = est
  const secteur = Math.round(((angle + 360) % 360) / 45) % 8
  return `vers ${POINTS_CARDINAUX[secteur]}`
}

/** Mise en forme de la longueur : « 12 km », « 3,4 km ». */
export function formaterLongueur(longueurKm: number): string {
  const arrondie = longueurKm < 10 ? Math.round(longueurKm * 10) / 10 : Math.round(longueurKm)
  return `${arrondie.toLocaleString('fr-FR')} km`
}

/**
 * Lit la réponse du service : ne garde que les cours d'eau qui portent un nom, regroupe les tronçons
 * d'un même cours d'eau, et renvoie les plus longs (une vingtaine au plus), du plus long au plus court.
 */
export function lireCoursEau(reponse: unknown, maximum: number = NOMBRE_MAXIMUM_COURS_EAU): CoursEau[] {
  const elements = (reponse as { features?: ContourGeoJson[] } | null)?.features ?? []
  const parCours = new Map<string, CoursEau>()
  for (const element of elements) {
    const nomBrut = element?.properties?.NomEntiteHydrographique
    if (typeof nomBrut !== 'string' || nomBrut.trim() === '' || lignesDeLaGeometrie(element.geometry).length === 0) continue
    const code = String(element.properties?.CdEntiteHydrographique ?? nomBrut)
    const longueur = longueurEnKm(element.geometry)
    const existant = parCours.get(code)
    if (existant) {
      existant.longueurKm += longueur
      existant.trace = {
        ...existant.trace,
        geometry: {
          type: 'MultiLineString',
          coordinates: [...lignesDeLaGeometrie(existant.trace.geometry), ...lignesDeLaGeometrie(element.geometry)],
        },
      }
      existant.sens = sensEcoulement(existant.trace.geometry)
    } else {
      parCours.set(code, {
        code,
        nom: nomLisible(nomBrut),
        longueurKm: longueur,
        sens: sensEcoulement(element.geometry),
        trace: { type: 'Feature', properties: { nom: nomLisible(nomBrut) }, geometry: element.geometry },
      })
    }
  }
  return [...parCours.values()].sort((premier, second) => second.longueurKm - premier.longueurKm).slice(0, maximum)
}
