import type { ContourGeoJson } from '@/lib/bassins'
import type { Limites } from '@/lib/coursEau'

/**
 * Les zones inondables d'un bassin (cartes des surfaces inondables de Géorisques) : requête et lecture
 * de la réponse (fonctions pures). Les trois niveaux de crue sont repris tels que la source les donne.
 */
export type IdNiveauCrue = 'frequente' | 'moyenne' | 'forte'

export interface NiveauCrue {
  id: IdNiveauCrue
  libelle: string
  /** Motif qui distingue le niveau sur la carte, en plus de la couleur. */
  motif: 'hachures' | 'points' | 'quadrillage'
  /** Description du motif, en texte, pour la légende. */
  descriptionMotif: string
  /** Valeurs du champ « scénario » de la source pour ce niveau. */
  scenarios: string[]
}

export const NIVEAUX_CRUE: NiveauCrue[] = [
  { id: 'frequente', libelle: 'Crue fréquente', motif: 'hachures', descriptionMotif: 'hachures obliques', scenarios: ['01for', 'frequent', 'fort'] },
  { id: 'moyenne', libelle: 'Crue moyenne', motif: 'points', descriptionMotif: 'points', scenarios: ['02moy', 'moyen'] },
  { id: 'forte', libelle: 'Crue forte (probabilité faible)', motif: 'quadrillage', descriptionMotif: 'quadrillage', scenarios: ['04fai', '03fai', 'faible'] },
]

export interface ZoneInondable {
  niveau: IdNiveauCrue
  communes: string[]
  /** Surface inondable, en GeoJSON, avec son niveau dans les propriétés. */
  trace: ContourGeoJson
}

const ADRESSE_GEORISQUES = 'https://www.georisques.gouv.fr/services'
/** Une couche par niveau de crue : débordement de cours d'eau, fréquent, moyen, faible. */
export const COUCHES_SURFACES_INONDABLES = ['ms:ALEA_SYNT_01_01FOR_FXX', 'ms:ALEA_SYNT_01_02MOY_FXX', 'ms:ALEA_SYNT_01_04FAI_FXX']
export const NOMBRE_MAXIMUM_ZONES = 300
/** En dessous de ce niveau de zoom (vue de la taille d'une agglomération), le service enverrait trop de morceaux. */
export const ZOOM_MINIMUM_ZONES_INONDABLES = 10

/**
 * Adresse des tuiles-images (service WMS) de l'ensemble des zones inondables, tous niveaux confondus :
 * légères, elles servent de loin, quand les surfaces détaillées seraient trop lourdes. {bbox-epsg-3857} est
 * remplacé par MapLibre pour chaque tuile.
 */
export const ADRESSE_TUILES_ZONES_INONDABLES =
  `${ADRESSE_GEORISQUES}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&STYLES=&FORMAT=image/png&TRANSPARENT=true` +
  `&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=${COUCHES_SURFACES_INONDABLES.map((couche) => couche.replace('ms:', '')).join(',')}` +
  '&BBOX={bbox-epsg-3857}'

/** Adresse de la requête « quelles zones inondables de cette couche touchent cette zone ? ». */
export function adresseZonesInondables(limites: Limites, couche: string): string {
  const [ouest, sud, est, nord] = limites
  const repere = 'urn:ogc:def:crs:EPSG::4326'
  const parametres = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: couche,
    OUTPUTFORMAT: 'geojson',
    SRSNAME: repere,
    COUNT: String(NOMBRE_MAXIMUM_ZONES),
    // Le service attend la latitude avant la longitude pour ce repère.
    BBOX: `${sud},${ouest},${nord},${est},${repere}`,
  })
  return `${ADRESSE_GEORISQUES}?${parametres.toString()}`
}

function texteDeLaPropriete(proprietes: Record<string, unknown> | null | undefined, noms: string[]): string | null {
  if (!proprietes) return null
  const cles = Object.keys(proprietes)
  for (const nom of noms) {
    const cle = cles.find((candidate) => candidate.toLowerCase() === nom)
    const valeur = cle ? proprietes[cle] : undefined
    if (typeof valeur === 'string' && valeur.trim() !== '') return valeur.trim()
  }
  return null
}

function niveauDuScenario(scenario: string | null): IdNiveauCrue | null {
  if (!scenario) return null
  const texte = scenario.toLowerCase()
  const niveau = NIVEAUX_CRUE.find((candidat) => candidat.scenarios.some((valeur) => texte.includes(valeur)))
  return niveau ? niveau.id : null
}

/** Sépare les noms de communes d'une propriété (« Rennes, Pacé »). */
function communesDeLaPropriete(texte: string | null): string[] {
  if (!texte) return []
  return texte
    .split(/[,;]/)
    .map((nom) => nom.trim())
    .filter((nom) => nom !== '')
}

/**
 * Lit la réponse du service : garde les surfaces d'un des trois niveaux de crue. Une réponse qui n'est
 * pas une liste de surfaces est une erreur (on n'invente jamais de zone).
 */
export function lireZonesInondables(reponse: unknown): ZoneInondable[] {
  const elements = (reponse as { features?: unknown } | null)?.features
  if (!Array.isArray(elements)) throw new Error('Réponse inattendue du service des zones inondables')
  const zones: ZoneInondable[] = []
  for (const element of elements as ContourGeoJson[]) {
    const proprietes = element?.properties as Record<string, unknown> | null | undefined
    const niveau = niveauDuScenario(texteDeLaPropriete(proprietes, ['scenario', 'typ_scenario', 'scenario_crue', 'type_scenario']))
    if (!niveau || !element.geometry) continue
    const communes = communesDeLaPropriete(texteDeLaPropriete(proprietes, ['libelle_commune', 'lib_commune', 'nom_commune', 'communes', 'commune']))
    zones.push({ niveau, communes, trace: { type: 'Feature', properties: { niveau }, geometry: element.geometry } })
  }
  return zones
}

export interface CommunesDuNiveau {
  niveau: NiveauCrue
  communes: string[]
}

/** Pour chaque niveau présent : les communes concernées, sans doublon, par ordre alphabétique. */
export function communesParNiveau(zones: ZoneInondable[]): CommunesDuNiveau[] {
  return NIVEAUX_CRUE.filter((niveau) => zones.some((zone) => zone.niveau === niveau.id)).map((niveau) => ({
    niveau,
    communes: [...new Set(zones.filter((zone) => zone.niveau === niveau.id).flatMap((zone) => zone.communes))].sort((premiere, seconde) =>
      premiere.localeCompare(seconde, 'fr'),
    ),
  }))
}
