import { describe, it, expect } from 'vitest'
import { adresseBassinAuPoint, formaterSurface, lireBassin, lireCommunes, nomLisible } from '../bassins'
import { surfaceEnKm2 } from '../geometrie'

// Un carré d'environ 10 km × 11,1 km près de l'équateur → environ 111 km².
const CARRE_EQUATEUR = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], [0, 0]]],
}

describe('surface d’un contour', () => {
  it('calcule la surface en km² d’un polygone', () => {
    expect(surfaceEnKm2(CARRE_EQUATEUR)).toBeCloseTo(123.6, 0)
  })

  it('retire les trous et additionne les morceaux d’un multi-polygone', () => {
    const trou = [[0.02, 0.02], [0.04, 0.02], [0.04, 0.04], [0.02, 0.04], [0.02, 0.02]]
    const avecTrou = { type: 'Polygon', coordinates: [...CARRE_EQUATEUR.coordinates, trou] }
    expect(surfaceEnKm2(avecTrou)).toBeLessThan(surfaceEnKm2(CARRE_EQUATEUR))
    const double = { type: 'MultiPolygon', coordinates: [CARRE_EQUATEUR.coordinates, CARRE_EQUATEUR.coordinates] }
    expect(surfaceEnKm2(double)).toBeCloseTo(2 * surfaceEnKm2(CARRE_EQUATEUR), 5)
  })

  it('vaut 0 sans polygone', () => {
    expect(surfaceEnKm2(null)).toBe(0)
    expect(surfaceEnKm2({ type: 'Point', coordinates: [1, 2] })).toBe(0)
  })
})

describe('bassins versants', () => {
  it('demande la bonne couche du Sandre selon le niveau', () => {
    const adresse = adresseBassinAuPoint([-1.68, 48.11], 'riviere')
    expect(adresse).toContain('TYPENAMES=sa%3ASecteurHydro')
    expect(adresse).toContain('48.11%2C-1.68')
    expect(adresseBassinAuPoint([-1.68, 48.11], 'grand')).toContain('sa%3ARegionHydro')
    expect(adresseBassinAuPoint([-1.68, 48.11], 'local')).toContain('sa%3AZoneHydro')
  })

  it('lit le nom, le code et la surface du bassin', () => {
    const reponse = {
      features: [
        { type: 'Feature', properties: { CdSecteurHydro: 'J7', LbSecteurHydro: 'la vilaine de sa source (nc)' }, geometry: CARRE_EQUATEUR },
      ],
    }
    const bassin = lireBassin(reponse, 'riviere')
    expect(bassin?.code).toBe('J7')
    expect(bassin?.nom).toBe('La vilaine de sa source (nc)')
    expect(bassin?.niveau).toBe('riviere')
    expect(bassin?.surfaceKm2).toBeGreaterThan(100)
  })

  it('renvoie null quand il n’y a aucun bassin ou une réponse inattendue', () => {
    expect(lireBassin({ features: [] }, 'riviere')).toBeNull()
    expect(lireBassin(null, 'local')).toBeNull()
    expect(lireBassin({ features: [{ properties: {}, geometry: null }] }, 'local')).toBeNull()
  })

  it('met en forme les noms et les surfaces', () => {
    expect(nomLisible('LA VILAINE DE LA VEUVRE (NC) A L\'ILLE (NC)')).toBe('La vilaine de la veuvre (nc) a l\'ille (nc)')
    expect(formaterSurface(5.04)).toBe('5 km²')
    expect(formaterSurface(12345.6)).toMatch(/^12\s?346 km²$/)
    expect(formaterSurface(3.26)).toMatch(/^3,3 km²$/)
  })
})

describe('communes', () => {
  it('lit les suggestions et ignore celles qui sont incomplètes', () => {
    const communes = lireCommunes([
      { code: '35238', nom: 'Rennes', centre: { coordinates: [-1.6884, 48.1159] }, departement: { nom: 'Ille-et-Vilaine' } },
      { code: '1', nom: 'Sans centre' },
      { nom: 'Sans code', centre: { coordinates: [1, 2] } },
    ])
    expect(communes).toEqual([{ code: '35238', nom: 'Rennes', departement: 'Ille-et-Vilaine', centre: [-1.6884, 48.1159] }])
    expect(lireCommunes('autre chose')).toEqual([])
  })
})
