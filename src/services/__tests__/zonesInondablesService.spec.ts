import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Limites } from '@/lib/coursEau'
import { chercherZonesInondablesDansLaZone } from '../zonesInondablesService'

const limites: Limites = [-2, 47, -1.9, 47.1]

const surfaceFrequente = { type: 'Feature', properties: { scenario: '01For' }, geometry: { type: 'Polygon', coordinates: [] } }

describe('service des zones inondables', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('demande les trois niveaux de crue et accepte une page vide quand il n’y a aucune surface', async () => {
    const fetchSimule = vi
      .fn<(adresse: string) => Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [surfaceFrequente] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ features: [] })))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchSimule)
    const zones = await chercherZonesInondablesDansLaZone(limites)
    expect(fetchSimule).toHaveBeenCalledTimes(3)
    expect(zones.map((zone) => zone.niveau)).toEqual(['frequente'])
  })

  it('signale une panne du service', async () => {
    vi.stubGlobal('fetch', vi.fn<() => Promise<Response>>().mockResolvedValue(new Response('', { status: 503 })))
    await expect(chercherZonesInondablesDansLaZone(limites)).rejects.toThrow('indisponible')
  })
})
