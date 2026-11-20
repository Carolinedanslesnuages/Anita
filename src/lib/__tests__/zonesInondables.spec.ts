import { describe, expect, it } from 'vitest'
import { adresseTuilesZonesInondables, NIVEAUX_CRUE } from '@/lib/zonesInondables'

describe('zones inondables (images du service)', () => {
  it('donne trois niveaux de crue, chacun avec sa couche', () => {
    expect(NIVEAUX_CRUE.map((niveau) => niveau.id)).toEqual(['frequente', 'moyenne', 'faible'])
    expect(new Set(NIVEAUX_CRUE.map((niveau) => niveau.couche)).size).toBe(3)
  })

  it('demande les tuiles d’un niveau, avec l’emplacement rempli par la carte', () => {
    const adresse = new URL(adresseTuilesZonesInondables(NIVEAUX_CRUE[1]!).replace('{bbox-epsg-3857}', '1,2,3,4'))
    expect(adresse.searchParams.get('LAYERS')).toBe('ALEA_SYNT_01_02MOY_FXX')
    expect(adresse.searchParams.get('BBOX')).toBe('1,2,3,4')
    expect(adresse.searchParams.get('TRANSPARENT')).toBe('true')
  })
})
