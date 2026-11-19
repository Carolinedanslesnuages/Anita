import { describe, it, expect } from 'vitest'
import { adresseZonesInondables, communesParNiveau, lireZonesInondables, NIVEAUX_CRUE } from '@/lib/zonesInondables'

const geometrie = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
const surface = (scenario: string, communes: string) => ({
  type: 'Feature',
  properties: { scenario, libelle_commune: communes },
  geometry: geometrie,
})

describe('zones inondables (lecture de la source)', () => {
  it('donne trois niveaux, chacun avec un motif différent', () => {
    expect(NIVEAUX_CRUE.map((niveau) => niveau.id)).toEqual(['frequente', 'moyenne', 'forte'])
    expect(new Set(NIVEAUX_CRUE.map((niveau) => niveau.motif)).size).toBe(3)
  })

  it('ne demande que les zones de la boîte du bassin (latitude avant longitude)', () => {
    const adresse = new URL(adresseZonesInondables([-2, 47, -1, 48], 'ms:ALEA_SYNT_01_01FOR_FXX'))
    expect(adresse.searchParams.get('TYPENAMES')).toBe('ms:ALEA_SYNT_01_01FOR_FXX')
    expect(adresse.searchParams.get('BBOX')).toBe('47,-2,48,-1,urn:ogc:def:crs:EPSG::4326')
  })

  it('reconnaît les trois niveaux et ignore les autres scénarios', () => {
    const zones = lireZonesInondables({
      features: [surface('01For', 'Rennes'), surface('02Moy', 'Pacé'), surface('04Fai', 'Rennes, Vern'), surface('04Ext', 'Autre')],
    })
    expect(zones.map((zone) => zone.niveau)).toEqual(['frequente', 'moyenne', 'forte'])
    expect(zones[2]?.communes).toEqual(['Rennes', 'Vern'])
  })

  it('regroupe les communes par niveau, sans doublon, par ordre alphabétique', () => {
    const zones = lireZonesInondables({ features: [surface('01For', 'Vern'), surface('01For', 'Acigné, Vern')] })
    const groupes = communesParNiveau(zones)
    expect(groupes).toHaveLength(1)
    expect(groupes[0]?.communes).toEqual(['Acigné', 'Vern'])
  })

  it('refuse une réponse inattendue plutôt que d’inventer des zones', () => {
    expect(() => lireZonesInondables({ erreur: 'x' })).toThrow('Réponse inattendue')
  })
})
