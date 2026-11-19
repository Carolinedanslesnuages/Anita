/** Calculs sur des contours GeoJSON (fonctions pures). Coordonnées en [longitude, latitude]. */
const RAYON_TERRE_METRES = 6371008.8

type Anneau = number[][]

const enRadians = (degres: number): number => (degres * Math.PI) / 180

/** Surface (m²) d'un anneau sur la sphère terrestre, toujours positive. */
function surfaceAnneau(anneau: Anneau): number {
  let somme = 0
  for (let rang = 0; rang < anneau.length - 1; rang++) {
    const [longitudeDepart, latitudeDepart] = anneau[rang]!
    const [longitudeArrivee, latitudeArrivee] = anneau[rang + 1]!
    somme +=
      enRadians(longitudeArrivee! - longitudeDepart!) *
      (2 + Math.sin(enRadians(latitudeDepart!)) + Math.sin(enRadians(latitudeArrivee!)))
  }
  return Math.abs((somme * RAYON_TERRE_METRES * RAYON_TERRE_METRES) / 2)
}

function surfacePolygone(anneaux: Anneau[]): number {
  const [exterieur, ...trous] = anneaux
  if (!exterieur) return 0
  return surfaceAnneau(exterieur) - trous.reduce((total, trou) => total + surfaceAnneau(trou), 0)
}

/** Surface en km² d'un Polygon ou MultiPolygon ; 0 si la géométrie n'est pas un polygone. */
export function surfaceEnKm2(geometrie: { type?: string; coordinates?: unknown } | null | undefined): number {
  if (!geometrie) return 0
  let metresCarres = 0
  if (geometrie.type === 'Polygon') metresCarres = surfacePolygone(geometrie.coordinates as Anneau[])
  if (geometrie.type === 'MultiPolygon') {
    metresCarres = (geometrie.coordinates as Anneau[][]).reduce((total, polygone) => total + surfacePolygone(polygone), 0)
  }
  return metresCarres / 1_000_000
}
