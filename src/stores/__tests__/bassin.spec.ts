import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Bassin, Commune, IdNiveau, Position } from '@/lib/bassins'

const { chercherBassinAuPoint } = vi.hoisted(() => ({
  chercherBassinAuPoint: vi.fn<(position: Position, niveau: IdNiveau) => Promise<Bassin | null>>(),
}))
vi.mock('@/services/bassinsService', () => ({ chercherBassinAuPoint }))

const { useBassinStore } = await import('../bassin')

const vilaine: Bassin = {
  code: 'J7',
  nom: 'La Vilaine',
  niveau: 'riviere',
  surfaceKm2: 1234,
  contour: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
}
const rennes: Commune = { code: '35238', nom: 'Rennes', departement: 'Ille-et-Vilaine', centre: [-1.6884, 48.1159] }

describe('store bassin', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    chercherBassinAuPoint.mockReset()
  })

  it('choisir une commune cherche le bassin de son centre, au niveau rivière par défaut', async () => {
    chercherBassinAuPoint.mockResolvedValue(vilaine)
    const magasin = useBassinStore()
    await magasin.choisirCommune(rennes)
    expect(chercherBassinAuPoint).toHaveBeenCalledWith([-1.6884, 48.1159], 'riviere')
    expect(magasin.bassin?.nom).toBe('La Vilaine')
    expect(magasin.commune?.nom).toBe('Rennes')
  })

  it('choisir un point sur la carte cherche son bassin et oublie la commune', async () => {
    chercherBassinAuPoint.mockResolvedValue(vilaine)
    const magasin = useBassinStore()
    await magasin.choisirCommune(rennes)
    await magasin.choisirPoint([-2, 48])
    expect(magasin.commune).toBeNull()
    expect(magasin.point).toEqual([-2, 48])
    expect(chercherBassinAuPoint).toHaveBeenLastCalledWith([-2, 48], 'riviere')
  })

  it('changer de niveau relance la recherche au même point', async () => {
    chercherBassinAuPoint.mockResolvedValue(vilaine)
    const magasin = useBassinStore()
    await magasin.choisirPoint([-2, 48])
    await magasin.changerNiveau('grand')
    expect(chercherBassinAuPoint).toHaveBeenLastCalledWith([-2, 48], 'grand')
    expect(magasin.niveau).toBe('grand')
  })

  it('signale un point sans bassin', async () => {
    chercherBassinAuPoint.mockResolvedValue(null)
    const magasin = useBassinStore()
    await magasin.choisirPoint([0, 0])
    expect(magasin.aucunBassin).toBe(true)
    expect(magasin.bassin).toBeNull()
  })

  it('signale un service en panne', async () => {
    chercherBassinAuPoint.mockRejectedValue(new Error('panne'))
    const magasin = useBassinStore()
    await magasin.choisirPoint([-2, 48])
    expect(magasin.erreur).toContain('ne répond pas')
    expect(magasin.chargement).toBe(false)
  })

  it('ignore la réponse d’une recherche dépassée', async () => {
    let terminerPremiere: (bassin: Bassin | null) => void = () => {}
    chercherBassinAuPoint.mockImplementationOnce(() => new Promise((resolve) => (terminerPremiere = resolve)))
    chercherBassinAuPoint.mockResolvedValueOnce({ ...vilaine, nom: 'La Loire' })
    const magasin = useBassinStore()
    const premiere = magasin.choisirPoint([1, 1])
    await magasin.choisirPoint([2, 2])
    terminerPremiere(vilaine)
    await premiere
    expect(magasin.bassin?.nom).toBe('La Loire')
  })
})
